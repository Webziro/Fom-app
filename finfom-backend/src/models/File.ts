import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// --- NEW INTERFACE FOR VERSION HISTORY ---
export interface IVersion {
  versionNumber: number;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
  cloudinaryId: string;
  url: string;
  secureUrl: string;
  size: number;
  fileType: string;
}

// --- UPDATED MAIN INTERFACE ---
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
  folderId?: mongoose.Types.ObjectId;
  
  // NEW: Content Hash field
  fileHash: string; 

  // NEW: Version control fields
  versions: IVersion[]; 
  currentVersion: number;

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
  // Note: The top-level cloudinaryId, url, secureUrl, size, and fileType
  // will represent the CURRENT version's data.
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
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
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
  },
  // --- NEW FIELD ---
  fileHash: {
    type: String,
    required: true,
    index: true
  },
  currentVersion: {
  type: Number,
  default: 1,
},
versions: {
  type: [{
    versionNumber: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cloudinaryId: { type: String, required: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    size: { type: Number, required: true },
    fileType: { type: String, required: true },
  }],
  default: [],
},
}, {
  timestamps: true
});

// Pre-save hook for password hashing (remains the same)
FileSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method for comparing password (remains the same)
FileSchema.methods.comparePassword = async function(candidatePassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

FileSchema.index({ title: 'text', description: 'text' });
// Composite index for uploaderId, title, and groupId to optimize common queries
FileSchema.index({ uploaderId: 1, title: 1, groupId: 1 });
FileSchema.index({ fileHash: 1 });

export default mongoose.model<IFile>('File', FileSchema);