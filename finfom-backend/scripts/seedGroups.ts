// scripts/seedGroups.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../src/models/Group';

dotenv.config();

const systemGroups = [
  { title: 'tech', displayName: 'Technology', description: 'All things tech and innovation', isSystem: true },
  { title: 'comedy', displayName: 'Comedy', description: 'Funny memes and jokes', isSystem: true },
  { title: 'politics', displayName: 'Politics', description: 'Political discussions and news', isSystem: true },
  { title: 'religion', displayName: 'Religion', description: 'Faith and spirituality', isSystem: true },
  { title: 'sports', displayName: 'Sports', description: 'Game highlights and scores', isSystem: true },
  { title: 'sex', displayName: 'Adult', description: 'Mature content', isSystem: true },
  { title: 'business', displayName: 'Business', description: 'Finance and entrepreneurship', isSystem: true },
  { title: 'education', displayName: 'Education', description: 'Learning resources', isSystem: true },
  { title: 'health', displayName: 'Health', description: 'Wellness and fitness', isSystem: true },
  { title: 'science', displayName: 'Science', description: 'Research and discoveries', isSystem: true },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    for (const group of systemGroups) {
      const exists = await Group.findOne({ title: group.title });
      if (!exists) {
        await Group.create(group);
      } else {
      }
    }
    process.exit(0);
  } catch (error) {
    //console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();