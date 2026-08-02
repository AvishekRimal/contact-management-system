import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { verifyAuth } from '@/lib/auth';

// Admins bypass visibility restrictions entirely; everyone else can only
// access records that are unrestricted (empty visibleToRoles) or explicitly
// shared with their own role.
function canAccessRecord(employee: any, authUser: any) {
  const roleDoc = (authUser as any)._resolvedRole;
  const isAdmin = (roleDoc?.name || '').toLowerCase() === 'admin';
  if (isAdmin) return true;

  const visibleToRoles: any[] = employee.visibleToRoles || [];
  if (visibleToRoles.length === 0) return true;

  return visibleToRoles.some((r: any) => r.toString() === roleDoc?._id?.toString());
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

    await connectToDatabase();

    // Explicitly unwrap dynamic params in Next.js 15
    const { id } = await params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

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

    await connectToDatabase();

    // Explicitly unwrap dynamic params in Next.js 15
    const { id } = await params;
    const payload = await req.json();

    const existingEmployee = await Employee.findById(id);
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    if (!canAccessRecord(existingEmployee, isAuthorized)) {
      return NextResponse.json({ error: 'Forbidden: You do not have visibility access to this record' }, { status: 403 });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEmployee, { status: 200 });
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

    await connectToDatabase();

    // Explicitly unwrap dynamic params in Next.js 15
    const { id } = await params;

    const existingEmployee = await Employee.findById(id);
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    if (!canAccessRecord(existingEmployee, isAuthorized)) {
      return NextResponse.json({ error: 'Forbidden: You do not have visibility access to this record' }, { status: 403 });
    }

    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Employee profile deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}