import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Role from '@/models/Role';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate edit permissions explicitly
    const requester = await verifyAuth(req, 'edit_roles');
    if (!requester) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const { name, permissions } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { $set: { name: name.trim(), permissions: permissions || [] } },
      { new: true }
    );

    if (!updatedRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRole, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate delete permissions explicitly
    const requester = await verifyAuth(req, 'delete_roles');
    if (!requester) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const roleToDelete = await Role.findById(id);
    if (roleToDelete && roleToDelete.name.toLowerCase() === 'admin') {
      return NextResponse.json({ error: 'Protected Resource: The master Admin role cannot be deleted' }, { status: 400 });
    }

    const deletedRole = await Role.findByIdAndDelete(id);
    if (!deletedRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}