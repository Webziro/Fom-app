import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  title: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  title: {
    type: String,
    required: [true, 'Group title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IGroup>('Group', GroupSchema);