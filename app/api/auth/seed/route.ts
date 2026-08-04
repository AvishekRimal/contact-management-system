import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    // 1. Check if Admin Role exists, if not, create it
    let adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' }
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'Admin',
          permissions: [
            'add_employee',
            'edit_employee',
            'delete_employee',
            'manage_contracts',
            'view_all'
          ]
        }
      });
    }

    // 2. Check if a default Admin user account exists
    const defaultAdminEmail = 'admin@system.com';
    let adminUser = await prisma.user.findUnique({
      where: { email: defaultAdminEmail }
    });

    if (!adminUser) {
      const passwordHash = await bcrypt.hash('password123', 10);
      
      adminUser = await prisma.user.create({
        data: {
          fullName: 'System Administrator',
          email: defaultAdminEmail,
          passwordHash,
          roleId: adminRole.id,
          image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        }
      });

      return NextResponse.json({
        message: 'Database seeded successfully',
        credentials: {
          email: defaultAdminEmail,
          password: 'password123',
          role: 'Admin'
        }
      }, { status: 201 });
    }

    return NextResponse.json({ message: 'Database was already seeded' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}