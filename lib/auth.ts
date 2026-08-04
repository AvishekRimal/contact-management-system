import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma, formatRole, formatUser } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-use-env-in-production';

export interface DecodedToken {
  userId: string;
  email: string;
  roleName: string;
}

export async function verifyAuth(req: NextRequest, requiredPermission?: string) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[auth] Missing or malformed Authorization Header');
      return null;
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (jwtError: any) {
      console.error('[auth] JWT verification error:', jwtError.message);
      return null;
    }
    
    if (!decoded || !decoded.userId) {
      console.warn('[auth] Decoded token does not contain a valid userId');
      return null;
    }

    // Fetch user with role via Prisma
    const rawUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!rawUser) {
      console.warn(`[auth] User matching ID ${decoded.userId} not found`);
      return null;
    }

    const roleDoc = rawUser.role ? formatRole(rawUser.role) : null;
    if (!roleDoc) {
      console.warn(`[auth] User "${rawUser.email}" has an invalid or missing role reference`);
      return null;
    }

    const formattedUser = formatUser(rawUser);
    (formattedUser as any)._resolvedRole = roleDoc;

    const roleName = roleDoc.name || '';
    const permissions = roleDoc.permissions || [];

    // Admin role automatically bypasses granular permissions
    if (roleName && roleName.toLowerCase() === 'admin') {
      return formattedUser;
    }

    // Dynamic granular permission validation
    if (requiredPermission && !permissions.includes(requiredPermission)) {
      console.warn(`[auth] User "${rawUser.email}" is missing permission: "${requiredPermission}"`);
      return null;
    }

    return formattedUser;
  } catch (error: any) {
    console.error('[auth] Internal verifyAuth error:', error.message);
    return null;
  }
}