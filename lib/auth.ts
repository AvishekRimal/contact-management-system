import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectToDatabase } from './db';
import User from '@/models/User';
import Role from '@/models/Role';

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

    await connectToDatabase();
    
    // Fetch raw user record
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.warn(`[auth] User matching ID ${decoded.userId} not found`);
      return null;
    }

    // --- Manual Reference Resolution Fallback ---
    // If Mongoose leaves the reference as an ObjectId or populates it incorrectly, 
    // we query the Role collection directly to resolve the target document.
    let roleDoc = null;
    if (user.role) {
      if (mongoose.Types.ObjectId.isValid(user.role)) {
        // It is an unpopulated ObjectId
        roleDoc = await Role.findById(user.role);
      } else {
        // It is already a populated object
        roleDoc = user.role;
      }
    }

    if (!roleDoc) {
      console.warn(`[auth] User "${user.email}" has an invalid or missing role reference`);
      return null;
    }

    // Standardize role parameters
    const roleName = roleDoc.name || '';
    const permissions = roleDoc.permissions || [];

    // Expose the resolved role doc on the returned user so callers that need
    // it (e.g. role-based visibility filtering) don't have to re-resolve it.
    // Existing callers only check truthiness of the return value, so this is additive.
    (user as any)._resolvedRole = roleDoc;

    // Admin role automatically bypasses granular permissions
    if (roleName && roleName.toLowerCase() === 'admin') {
      return user;
    }

    // Dynamic granular permission validation
    if (requiredPermission && !permissions.includes(requiredPermission)) {
      console.warn(`[auth] User "${user.email}" is missing permission: "${requiredPermission}"`);
      return null;
    }

    return user;
  } catch (error: any) {
    console.error('[auth] Internal verifyAuth error:', error.message);
    return null;
  }
}