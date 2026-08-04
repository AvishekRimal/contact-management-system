import { NextRequest, NextResponse } from 'next/server';
import { prisma, formatUser } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const rawUser = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!rawUser) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, rawUser.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = formatUser(rawUser);

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return NextResponse.json({
      token,
      user: { id: user._id, _id: user._id, fullName: user.fullName, email: user.email, role: user.role, image: user.image }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}