import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const employeeSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
  contactInfo: z.object({
    email: z.string().trim().email('Primary email is invalid'),
    mobile: z.string().trim().min(7, 'Primary mobile phone must be at least 7 digits'),
    emails: z.array(z.string().email('Invalid email format')).optional().default([]),
    mobiles: z.array(z.string().min(5, 'Invalid phone number')).optional().default([]),
    permanentAddress: z.string().optional().default(''),
    temporaryAddress: z.string().optional().default(''),
  }),
  personalInfo: z.object({
    birthDate: z.string().optional().default(''),
    religion: z.string().optional().default(''),
    maritalStatus: z.string().optional().default(''),
    gender: z.string().optional().default(''),
    joinDate: z.string().optional().default(''),
    bloodGroup: z.string().optional().default(''),
  }),
  officeInfo: z.object({
    department: z.string().trim().min(2, 'Department is required'),
    courseTaught: z.string().optional().default(''),
    bank: z.string().optional().default(''),
    bankAccount: z.string().optional().default(''),
    panNumber: z.string().optional().default(''),
    ssfNumber: z.string().optional().default(''),
    status: z.enum(['Active', 'Inactive']).default('Active'),
  }),
  emergencyContact: z.object({
    contactPerson: z.string().optional().default(''),
    relation: z.string().optional().default(''),
    phone: z.string().optional().default(''),
  }),
});

export const userCreateSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  roleId: z.string().min(1, 'Please select a security role'),
  image: z.string().optional().default(''),
});

export const userEditSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().optional(),
  roleId: z.string().min(1, 'Please select a security role'),
  image: z.string().optional().default(''),
});

export const roleSchema = z.object({
  name: z.string().trim().min(2, 'Role title must be at least 2 characters'),
  permissions: z.array(z.string()).default([]),
});

export const qualificationSchema = z.object({
  level: z.string().trim().min(1, 'Degree level is required'),
  institute: z.string().trim().min(1, 'Institute name is required'),
  year: z.string().trim().min(1, 'Graduation year is required'),
  url: z.string().optional().default(''),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required'),
  proficiency: z.string().trim().min(1, 'Proficiency is required'),
});

export const experienceSchema = z.object({
  company: z.string().trim().min(1, 'Company name is required'),
  role: z.string().trim().min(1, 'Job role is required'),
  duration: z.string().trim().min(1, 'Duration is required'),
  url: z.string().optional().default(''),
});

export const contractSchema = z.object({
  title: z.string().trim().min(1, 'Contract title is required'),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().optional().default(''),
  url: z.string().optional().default(''),
});

export const referenceSchema = z.object({
  name: z.string().trim().min(1, 'Reference name is required'),
  designation: z.string().trim().min(1, 'Designation is required'),
  contact: z.string().trim().min(1, 'Contact number is required'),
  email: z.string().optional().default(''),
  company: z.string().optional().default(''),
});

export const disciplinarySchema = z.object({
  date: z.string().trim().min(1, 'Date is required'),
  issue: z.string().trim().min(1, 'Issue/Case description is required'),
  actionTaken: z.string().trim().min(1, 'Action taken is required'),
  severity: z.string().optional().default('Low'),
  url: z.string().optional().default(''),
});

export const inactivateSchema = z.object({
  date: z.string().optional().default(''),
});

export const resignationSchema = z.object({
  employeeId: z.string().optional(),
  date: z.string().trim().min(1, 'Resignation date is required'),
  reason: z.string().trim().min(2, 'Reason for resignation is required'),
  status: z.enum(['Pending', 'Approved', 'Completed', 'Rejected']).default('Completed'),
  url: z.string().optional().default(''),
});

