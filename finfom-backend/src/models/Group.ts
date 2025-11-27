import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  title: string;
  displayName?: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  fileCount: Number;
}

const GroupSchema = new Schema<IGroup>({
  title: {
    type: String,
    required: [true, 'Group title is required'],
    trim: true,
    maxlength: 100,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 500,
    required: [true, 'Group description is required'],
      isSystem: {
    type: Boolean,
    default: false,
  }
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

GroupSchema.pre('save', function(next) {
  this.displayName = this.displayName || this.name.charAt(0).toUpperCase() + this.name.slice(1);
  next();
});

export default mongoose.model<IGroup>('Group', GroupSchema);


