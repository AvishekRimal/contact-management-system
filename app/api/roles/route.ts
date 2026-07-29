import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Role from '@/models/Role';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const roles = await Role.find({});
    return NextResponse.json(roles, { status: 200 });
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

    await connectToDatabase();
    const { name, permissions } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const newRole = await Role.create({
      name: name.trim(),
      permissions: permissions || []
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}