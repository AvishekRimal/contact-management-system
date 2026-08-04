import { NextRequest, NextResponse } from 'next/server';
import { prisma, formatEmployee } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const roleDoc = (authUser as any)._resolvedRole;
    const isAdmin = (roleDoc?.name || '').toLowerCase() === 'admin';

    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (!isAdmin && roleDoc?._id) {
      andConditions.push({
        OR: [
          { visibleToRoles: { isEmpty: true } },
          { visibleToRoles: { has: roleDoc._id } },
          { visibleToRoles: { has: roleDoc.id } }
        ]
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;

    const total = await prisma.employee.count({ where });
    const rawEmployees = await prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const employees = rawEmployees.map(formatEmployee);

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

    const payload = await req.json();

    const email = payload.contactInfo?.email || payload.email;
    const department = payload.officeInfo?.department || payload.department;

    if (!email || !department) {
      return NextResponse.json({ error: 'Missing core profile fields (email, department)' }, { status: 400 });
    }

    const existingEmployee = await prisma.employee.findFirst({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingEmployee) {
      return NextResponse.json({ error: 'An employee with this email is already registered' }, { status: 400 });
    }

    const newEmployee = await prisma.employee.create({
      data: {
        fullName: payload.fullName || '',
        email: email.toLowerCase().trim(),
        department,
        status: payload.officeInfo?.status || payload.status || 'Active',
        personalInfo: payload.personalInfo || {},
        officeInfo: payload.officeInfo || {},
        contactInfo: payload.contactInfo || {},
        shiftAndPunch: payload.shiftAndPunch || {},
        emergencyContact: payload.emergencyContact || {},
        qualifications: payload.qualifications || [],
        skills: payload.skills || [],
        experience: payload.experience || [],
        references: payload.references || [],
        documents: payload.documents || [],
        officeActivities: payload.officeActivities || {},
        visibleToRoles: payload.visibleToRoles || [],
      }
    });

    return NextResponse.json(formatEmployee(newEmployee), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}