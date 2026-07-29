import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: mongoose.Types.ObjectId;
  image: string;
}

const UserSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  image: { type: String, default: '' }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);