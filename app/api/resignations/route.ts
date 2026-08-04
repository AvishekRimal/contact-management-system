import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { resignationSchema } from '@/lib/validations';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = (await verifyAuth(req, 'view_resignation')) || (await verifyAuth(req, 'manage_resignation'));
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to view resignations' }, { status: 403 });
    }

    const employees = await prisma.employee.findMany();

    const resignationsList: any[] = [];
    employees.forEach(emp => {
      const officeActivities: any = emp.officeActivities || {};
      const contactInfo: any = emp.contactInfo || {};
      const officeInfo: any = emp.officeInfo || {};

      if (officeActivities.resignations && Array.isArray(officeActivities.resignations)) {
        officeActivities.resignations.forEach((r: any) => {
          resignationsList.push({
            _id: r._id || r.id,
            employeeId: emp.id,
            employeeName: emp.fullName,
            employeeEmail: contactInfo.email || emp.email || '',
            department: officeInfo.department || emp.department || '',
            date: r.date,
            reason: r.reason,
            status: r.status || 'Completed',
            url: r.url || '',
            createdAt: r.createdAt || emp.updatedAt?.toISOString() || new Date().toISOString(),
          });
        });
      }
    });

    // Sort by date descending
    resignationsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(resignationsList, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = (await verifyAuth(req, 'add_resignation')) || (await verifyAuth(req, 'manage_resignation'));
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to add resignation' }, { status: 403 });
    }

    const payload = await req.json();

    const val = resignationSchema.safeParse(payload);
    if (!val.success) {
      return NextResponse.json({ error: val.error.issues[0].message }, { status: 400 });
    }

    if (!payload.employeeId) {
      return NextResponse.json({ error: 'Please select an employee' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId }
    });
    if (!employee) {
      return NextResponse.json({ error: 'Target employee record not found' }, { status: 404 });
    }

    const newResignationId = crypto.randomUUID();
    const newResignation = {
      _id: newResignationId,
      id: newResignationId,
      date: payload.date,
      reason: payload.reason,
      status: payload.status || 'Completed',
      url: payload.url || '',
    };

    const officeActivities: any = employee.officeActivities || { contracts: [], resignations: [], disciplinaryCases: [] };
    const resignationsList = Array.isArray(officeActivities.resignations) ? [...officeActivities.resignations, newResignation] : [newResignation];
    
    const updatedOfficeActivities = {
      ...officeActivities,
      resignations: resignationsList
    };

    const updatedEmployee = await prisma.employee.update({
      where: { id: payload.employeeId },
      data: {
        officeActivities: updatedOfficeActivities
      }
    });

    return NextResponse.json({ message: 'Resignation registered successfully', employee: updatedEmployee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
