import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from './db.js';
import User from './models/User.js';

async function run() {
  await connectDB();

  const instructor = await User.findOneAndUpdate(
    { email: 'instructor@learnloop.dev' },
    {
      $set: {
        name: 'Anas Manzoor',
        headline: 'Software Engineering Student'
      }
    },
    { new: true }
  );

  if (!instructor) {
    console.error('Instructor account not found. Run npm run seed first.');
    process.exitCode = 1;
  } else {
    console.log(`Updated instructor: ${instructor.name} — ${instructor.headline}`);
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Instructor update failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
