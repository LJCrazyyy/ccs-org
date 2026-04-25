import { firestore } from '../src/firestore.js';

const firstNames = [
  'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Mason', 'Michael', 'Ethan', 'Daniel', 'Jacob', 'Logan', 'Jackson', 'Levi', 'Sebastian', 'Mateo',
  'Jack', 'Owen', 'Theodore', 'Aiden', 'Samuel', 'Joseph', 'John', 'David', 'Wyatt', 'Matthew',
  'Luke', 'Asher', 'Carter', 'Julian', 'Grayson', 'Leo', 'Jayden', 'Gabriel', 'Isaac', 'Lincoln',
  'Anthony', 'Hudson', 'Dylan', 'Ezra', 'Thomas', 'Charles', 'Christopher', 'Jaxon', 'Maverick', 'Josiah',
  'Ava', 'Emma', 'Sophia', 'Isabella', 'Mia', 'Evelyn', 'Harper', 'Luna', 'Camila', 'Gianna',
  'Elizabeth', 'Eleanor', 'Ella', 'Abigail', 'Sofia', 'Avery', 'Scarlett', 'Emily', 'Aria', 'Penelope',
  'Chloe', 'Layla', 'Mila', 'Nora', 'Hazel', 'Madison', 'Ellie', 'Lily', 'Nova', 'Isla',
  'Grace', 'Violet', 'Aurora', 'Riley', 'Zoey', 'Willow', 'Emilia', 'Stella', 'Zoe', 'Victoria',
  'Hannah', 'Addison', 'Leah', 'Lucy', 'Eliana', 'Ivy', 'Everly', 'Lillian', 'Paisley', 'Natalie'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const buildRealisticName = (index) => {
  const firstName = firstNames[(index - 1) % firstNames.length];
  const lastName = lastNames[Math.floor((index - 1) / firstNames.length) % lastNames.length];
  return `${firstName} ${lastName}`;
};

const commitInChunks = async (updates) => {
  const chunkSize = 400;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const batch = firestore.batch();

    for (const update of chunk) {
      batch.set(update.ref, update.data, { merge: true });
    }

    await batch.commit();
  }
};

const main = async () => {
  const snapshot = await firestore.collection('students').get();
  const updates = [];
  let matched = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() ?? {};
    const email = String(data.email ?? '').toLowerCase();
    const match = /^student(\d{4})@students\.local$/.exec(email);

    if (!match) {
      continue;
    }

    const index = Number.parseInt(match[1], 10);
    if (!Number.isFinite(index) || index < 1 || index > 1000) {
      continue;
    }

    matched += 1;
    const name = buildRealisticName(index);
    const timestamp = new Date().toISOString();

    if (String(data.name ?? '') !== name) {
      updates.push({
        ref: docSnap.ref,
        data: {
          name,
          updatedAt: timestamp,
          updated_at: timestamp,
        },
      });

      updates.push({
        ref: firestore.collection('users').doc(docSnap.id),
        data: {
          id: docSnap.id,
          name,
          email,
          role: 'student',
          updatedAt: timestamp,
          updated_at: timestamp,
        },
      });
    }
  }

  await commitInChunks(updates);

  console.log(`[normalize-seeded-student-names] matched seeded students: ${matched}`);
  console.log(`[normalize-seeded-student-names] documents updated: ${updates.length}`);
};

main().catch((error) => {
  console.error('[normalize-seeded-student-names] failed', error);
  process.exit(1);
});
