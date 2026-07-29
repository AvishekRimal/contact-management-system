import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Role from '@/models/Role';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // 1. Check if Admin Role exists, if not, create it
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        permissions: [
          'add_employee',
          'edit_employee',
          'delete_employee',
          'manage_contracts',
          'view_all'
        ]
      });
    }

    // 2. Check if a default Admin user account exists
    const defaultAdminEmail = 'admin@system.com';
    let adminUser = await User.findOne({ email: defaultAdminEmail });

    if (!adminUser) {
      // Hash a default password: "password123"
      const passwordHash = await bcrypt.hash('password123', 10);
      
      adminUser = await User.create({
        fullName: 'System Administrator',
        email: defaultAdminEmail,
        passwordHash,
        role: adminRole._id,
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
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