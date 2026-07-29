import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const users = await User.find({}).populate('role', 'name permissions');
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorizedUser = await verifyAuth(req, 'add_users');
    if (!authorizedUser) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await connectToDatabase();
    const { fullName, email, password, role, image } = await req.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required account details' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      image: image || ''
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}