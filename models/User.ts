export interface IUser {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  role?: any;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}