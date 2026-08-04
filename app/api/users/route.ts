import { NextRequest, NextResponse } from 'next/server';
import { prisma, formatUser } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users.map(formatUser), { status: 200 });
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

    const { fullName, email, password, role, image } = await req.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required account details' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        roleId: role,
        image: image || ''
      },
      include: { role: true }
    });

    return NextResponse.json(formatUser(newUser), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}