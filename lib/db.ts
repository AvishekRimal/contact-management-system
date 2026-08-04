import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectToDatabase() {
  return prisma;
}

export function formatRole(role: any) {
  if (!role) return null;
  return {
    ...role,
    _id: role.id,
  };
}

export function formatUser(user: any) {
  if (!user) return null;
  const role = user.role ? formatRole(user.role) : user.roleId;
  return {
    ...user,
    _id: user.id,
    role,
  };
}

export function formatEmployee(emp: any) {
  if (!emp) return null;
  return {
    ...emp,
    _id: emp.id,
  };
}