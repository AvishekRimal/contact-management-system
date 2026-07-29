import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  permissions: string[]; // e.g., ['manage_contracts', 'edit_employee', 'view_all', 'delete_employee']
}

const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true },
  permissions: { type: [String], default: [] }
});

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);