import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // Read status parameter

    const roleDoc = (authUser as any)._resolvedRole;
    const isAdmin = (roleDoc?.name || '').toLowerCase() === 'admin';

    const andConditions: any[] = [];

    // Support matching query terms against Name OR Email
    if (search) {
      andConditions.push({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { 'contactInfo.email': { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (status) {
      andConditions.push({ 'officeInfo.status': status });
    }

    // Non-admins only see records visible to every role (empty visibleToRoles)
    // or explicitly shared with their own role. Admins always see everything.
    if (!isAdmin && roleDoc?._id) {
      andConditions.push({
        $or: [
          { visibleToRoles: { $exists: false } },
          { visibleToRoles: { $size: 0 } },
          { visibleToRoles: roleDoc._id }
        ]
      });
    }

    const query: any = andConditions.length > 0 ? { $and: andConditions } : {};

    const skip = (page - 1) * limit;
    
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAuth(req, 'add_employee');
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await connectToDatabase();
    const payload = await req.json();

    if (!payload.contactInfo?.email || !payload.officeInfo?.department) {
      return NextResponse.json({ error: 'Missing core profile fields (email, department)' }, { status: 400 });
    }

    const existingEmployee = await Employee.findOne({ 'contactInfo.email': payload.contactInfo.email });
    if (existingEmployee) {
      return NextResponse.json({ error: 'An employee with this email is already registered' }, { status: 400 });
    }

    const employee = await Employee.create(payload);
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}