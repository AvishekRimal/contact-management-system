import { NextRequest, NextResponse } from 'next/server';
import { prisma, formatRole } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(roles.map(formatRole), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorizedUser = await verifyAuth(req, 'add_roles');
    if (!authorizedUser) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { name, permissions } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const existingRole = await prisma.role.findUnique({
      where: { name: name.trim() }
    });
    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        name: name.trim(),
        permissions: permissions || []
      }
    });

    return NextResponse.json(formatRole(newRole), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}