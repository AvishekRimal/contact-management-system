import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = (await verifyAuth(req, 'edit_resignation')) || (await verifyAuth(req, 'manage_resignation'));
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to edit resignation' }, { status: 403 });
    }

    const { id } = await params;
    const payload = await req.json();

    const employees = await prisma.employee.findMany();
    let targetEmp: any = null;
    let targetResignation: any = null;

    for (const emp of employees) {
      const officeActivities: any = emp.officeActivities || {};
      if (Array.isArray(officeActivities.resignations)) {
        const item = officeActivities.resignations.find((r: any) => r._id === id || r.id === id);
        if (item) {
          targetEmp = emp;
          targetResignation = item;
          break;
        }
      }
    }

    if (!targetEmp || !targetResignation) {
      return NextResponse.json({ error: 'Resignation record not found' }, { status: 404 });
    }

    const officeActivities: any = targetEmp.officeActivities || {};
    const updatedResignations = officeActivities.resignations.map((r: any) => {
      if (r._id === id || r.id === id) {
        return {
          ...r,
          date: payload.date !== undefined ? payload.date : r.date,
          reason: payload.reason !== undefined ? payload.reason : r.reason,
          status: payload.status !== undefined ? payload.status : r.status,
          url: payload.url !== undefined ? payload.url : r.url,
        };
      }
      return r;
    });

    const updatedEmployee = await prisma.employee.update({
      where: { id: targetEmp.id },
      data: {
        officeActivities: {
          ...officeActivities,
          resignations: updatedResignations
        }
      }
    });

    return NextResponse.json({ message: 'Resignation updated successfully', employee: updatedEmployee }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = (await verifyAuth(req, 'delete_resignation')) || (await verifyAuth(req, 'manage_resignation'));
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to delete resignation' }, { status: 403 });
    }

    const { id } = await params;

    const employees = await prisma.employee.findMany();
    let targetEmp: any = null;

    for (const emp of employees) {
      const officeActivities: any = emp.officeActivities || {};
      if (Array.isArray(officeActivities.resignations)) {
        const item = officeActivities.resignations.find((r: any) => r._id === id || r.id === id);
        if (item) {
          targetEmp = emp;
          break;
        }
      }
    }

    if (!targetEmp) {
      return NextResponse.json({ error: 'Resignation record not found' }, { status: 404 });
    }

    const officeActivities: any = targetEmp.officeActivities || {};
    const filteredResignations = (officeActivities.resignations || []).filter(
      (r: any) => r._id !== id && r.id !== id
    );

    await prisma.employee.update({
      where: { id: targetEmp.id },
      data: {
        officeActivities: {
          ...officeActivities,
          resignations: filteredResignations
        }
      }
    });

    return NextResponse.json({ message: 'Resignation record deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
