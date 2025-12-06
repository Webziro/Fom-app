import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  title: string;
  displayName: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  fileCount: number;
  isSystem?: boolean;
}

const GroupSchema = new Schema<IGroup>(
  {
    title: {
      type: String,
      required: [true, 'Group title is required'],
      trim: true,
      maxlength: 100,
      lowercase: true,
      unique: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      required: [true, 'Group description is required'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return !this.isSystem;
      },
      index: true,
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-generate displayName from title if not provided
GroupSchema.pre('save', function (next) {
  if (!this.displayName && this.title) {
    this.displayName =
      this.title.charAt(0).toUpperCase() + this.title.slice(1).replace(/_/g, ' ');
  }
  next();
});

export default mongoose.model<IGroup>('Group', GroupSchema);