import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { verifyAuth } from '@/lib/auth';
import { resignationSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = (await verifyAuth(req, 'view_resignation')) || (await verifyAuth(req, 'manage_resignation'));
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to view resignations' }, { status: 403 });
    }

    await connectToDatabase();

    const employees = await Employee.find({
      'officeActivities.resignations.0': { $exists: true }
    }).select('_id fullName contactInfo officeInfo officeActivities.resignations');

    const resignationsList: any[] = [];
    employees.forEach(emp => {
      if (emp.officeActivities?.resignations) {
        emp.officeActivities.resignations.forEach((r: any) => {
          resignationsList.push({
            _id: r._id,
            employeeId: emp._id,
            employeeName: emp.fullName,
            employeeEmail: emp.contactInfo?.email || '',
            department: emp.officeInfo?.department || '',
            date: r.date,
            reason: r.reason,
            status: r.status || 'Completed',
            url: r.url || '',
            createdAt: (r as any).createdAt || (emp as any).updatedAt || new Date().toISOString(),
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

    await connectToDatabase();
    const payload = await req.json();

    const val = resignationSchema.safeParse(payload);
    if (!val.success) {
      return NextResponse.json({ error: val.error.issues[0].message }, { status: 400 });
    }

    if (!payload.employeeId) {
      return NextResponse.json({ error: 'Please select an employee' }, { status: 400 });
    }

    const employee = await Employee.findById(payload.employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Target employee record not found' }, { status: 404 });
    }

    const newResignation = {
      date: payload.date,
      reason: payload.reason,
      status: payload.status || 'Completed',
      url: payload.url || '',
    };

    if (!employee.officeActivities) {
      employee.officeActivities = { contracts: [], resignations: [], disciplinaryCases: [] };
    }
    if (!employee.officeActivities.resignations) {
      employee.officeActivities.resignations = [];
    }

    employee.officeActivities.resignations.push(newResignation);
    await employee.save();

    return NextResponse.json({ message: 'Resignation registered successfully', employee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
