import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IFile extends Document {
  title: string;
  description?: string;
  uploaderId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  cloudinaryId: string;
  url: string;
  secureUrl: string;
  visibility: 'public' | 'private' | 'password';
  password?: string;
  size: number;
  fileType: string;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const FileSchema = new Schema<IFile>({
  title: {
    type: String,
    required: [true, 'File title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    required: [true, 'File description is required']
  },
  uploaderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  secureUrl: {
    type: String,
    required: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password'],
    default: 'private',
    index: true
  },
  password: {
    type: String,
    select: false
  },
  size: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  downloads: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

FileSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

FileSchema.methods.comparePassword = async function(candidatePassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

FileSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IFile>('File', FileSchema);