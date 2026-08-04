export interface IRole {
  _id?: string;
  id?: string;
  name: string;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}