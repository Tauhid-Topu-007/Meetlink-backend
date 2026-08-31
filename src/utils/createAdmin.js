require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: node src/utils/createAdmin.js <email>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetlink';
  await mongoose.connect(uri);

  const User = require('../models/User');
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found for ${email}. Register the account first, then run this command again.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  user.isActive = true;
  await user.save();

  console.log(`Admin role granted to ${user.email} (${user.displayName}).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
