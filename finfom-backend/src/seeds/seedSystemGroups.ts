import mongoose from 'mongoose';
import Group from '../src/models/Group';

const seedSystemGroups = async () => {
  try {
    // Check if system groups already exist
    const existingSystemGroups = await Group.countDocuments({ isSystem: true });
    
    if (existingSystemGroups > 0) {
      console.log('System groups already exist. Skipping seeding.');
      return;
    }

    const systemGroups = [
      { name: 'tech', displayName: 'Technology', isSystem: true },
      { name: 'comedy', displayName: 'Comedy', isSystem: true },
      { name: 'politics', displayName: 'Politics', isSystem: true },
      { name: 'sports', displayName: 'Sports', isSystem: true },
      { name: 'sex', displayName: 'Adult', isSystem: true },
      { name: 'religion', displayName: 'Religion', isSystem: true },
      { name: 'business', displayName: 'Business', isSystem: true },
      { name: 'education', displayName: 'Education', isSystem: true },
      { name: 'health', displayName: 'Health', isSystem: true },
      { name: 'science', displayName: 'Science', isSystem: true },
    ];

    await Group.insertMany(systemGroups);
    console.log(`Successfully seeded ${systemGroups.length} system groups.`);
  } catch (error) {
    console.error('Error seeding system groups:', error);
  } finally {
    mongoose.connection.close();
  }
};

export default seedSystemGroups;