import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
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

    await connectToDatabase();
    const { id } = await params;
    const payload = await req.json();

    const employee = await Employee.findOne({ 'officeActivities.resignations._id': id });
    if (!employee) {
      return NextResponse.json({ error: 'Resignation record not found' }, { status: 404 });
    }

    const resignationItem = employee.officeActivities?.resignations?.find(
      (r: any) => r._id?.toString() === id
    );

    if (resignationItem) {
      if (payload.date !== undefined) resignationItem.date = payload.date;
      if (payload.reason !== undefined) resignationItem.reason = payload.reason;
      if (payload.status !== undefined) resignationItem.status = payload.status;
      if (payload.url !== undefined) resignationItem.url = payload.url;

      await employee.save();
    }

    return NextResponse.json({ message: 'Resignation updated successfully', employee }, { status: 200 });
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

    await connectToDatabase();
    const { id } = await params;

    const employee = await Employee.findOne({ 'officeActivities.resignations._id': id });
    if (!employee) {
      return NextResponse.json({ error: 'Resignation record not found' }, { status: 404 });
    }

    if (employee.officeActivities?.resignations) {
      employee.officeActivities.resignations = employee.officeActivities.resignations.filter(
        (r: any) => r._id?.toString() !== id
      );
      await employee.save();
    }

    return NextResponse.json({ message: 'Resignation record deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
