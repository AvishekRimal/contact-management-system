import { NextRequest, NextResponse } from 'next/server';
import { prisma, formatEmployee } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

function canAccessRecord(employee: any, authUser: any) {
  const roleDoc = (authUser as any)._resolvedRole;
  const isAdmin = (roleDoc?.name || '').toLowerCase() === 'admin';
  if (isAdmin) return true;

  const visibleToRoles: any[] = employee.visibleToRoles || [];
  if (visibleToRoles.length === 0) return true;

  const userRoleId = roleDoc?._id || roleDoc?.id;
  return visibleToRoles.some((r: any) => r.toString() === userRoleId?.toString());
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const rawEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!rawEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    const employee = formatEmployee(rawEmployee);

    if (!canAccessRecord(employee, authUser)) {
      return NextResponse.json({ error: 'Forbidden: You do not have visibility access to this record' }, { status: 403 });
    }

    return NextResponse.json(employee, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;
    const payload = await req.json();

    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    if (!canAccessRecord(existingEmployee, isAuthorized)) {
      return NextResponse.json({ error: 'Forbidden: You do not have visibility access to this record' }, { status: 403 });
    }

    const email = payload.contactInfo?.email || payload.email || existingEmployee.email;
    const department = payload.officeInfo?.department || payload.department || existingEmployee.department;
    const status = payload.officeInfo?.status || payload.status || existingEmployee.status;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        fullName: payload.fullName ?? existingEmployee.fullName,
        email: email.toLowerCase().trim(),
        department,
        status,
        personalInfo: payload.personalInfo ?? (existingEmployee.personalInfo as any),
        officeInfo: payload.officeInfo ?? (existingEmployee.officeInfo as any),
        contactInfo: payload.contactInfo ?? (existingEmployee.contactInfo as any),
        shiftAndPunch: payload.shiftAndPunch ?? (existingEmployee.shiftAndPunch as any),
        emergencyContact: payload.emergencyContact ?? (existingEmployee.emergencyContact as any),
        qualifications: payload.qualifications ?? (existingEmployee.qualifications as any),
        skills: payload.skills ?? (existingEmployee.skills as any),
        experience: payload.experience ?? (existingEmployee.experience as any),
        references: payload.references ?? (existingEmployee.references as any),
        documents: payload.documents ?? (existingEmployee.documents as any),
        officeActivities: payload.officeActivities ?? (existingEmployee.officeActivities as any),
        visibleToRoles: payload.visibleToRoles ?? existingEmployee.visibleToRoles,
      }
    });

    return NextResponse.json(formatEmployee(updated), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAuth(req, 'delete_employee');
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    if (!canAccessRecord(existingEmployee, isAuthorized)) {
      return NextResponse.json({ error: 'Forbidden: You do not have visibility access to this record' }, { status: 403 });
    }

    await prisma.employee.delete({ where: { id } });

    return NextResponse.json({ message: 'Employee profile deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}