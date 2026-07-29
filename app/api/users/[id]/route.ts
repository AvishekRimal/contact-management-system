import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await verifyAuth(req, 'edit_users');
    if (!requester) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const { fullName, email, password, role, image } = await req.json();

    if (!fullName || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      role,
      image: image || ''
    };

    // Only hash and update password if a new password value is provided
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await verifyAuth(req, 'delete_users');
    if (!requester) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    // Prevent deleting your own logged-in session account
    if (requester._id.toString() === id) {
      return NextResponse.json({ error: 'Self-deletion of current session is prohibited' }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}