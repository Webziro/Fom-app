// seedSystemGroups.ts
const systemGroups = [
  { name: 'tech', displayName: 'Technology', isSystem: true },
  { name: 'comedy', displayName: 'Comedy', isSystem: true },
  { name: 'politics', displayName: 'Politics', isSystem: true },
  { name: 'sports', displayName: 'Sports', isSystem: true },
  { name: 'sex', displayName: 'Adult', isSystem: true },
  { name: 'religion', displayName: 'Religion', isSystem: true },
];

await Group.insertMany(systemGroups);