import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Explicitly unwrap dynamic params in Next.js 15
    const { id } = await params;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
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
    const isAuthorized = await verifyAuth(req, 'edit_employee');
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await connectToDatabase();
    
    // Explicitly unwrap dynamic params in Next.js 15
    const { id } = await params;
    const payload = await req.json();

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
    
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return NextResponse.json({ error: 'Employee registry record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Employee profile deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}