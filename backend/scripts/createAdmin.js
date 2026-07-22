import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../src/config/db.js";
import User from "../src/models/user.model.js";

const emailArg = process.argv[2];
const passwordArg = process.argv[3] || "Admin@12345";

if (!emailArg) {
  console.log("Usage: node scripts/createAdmin.js <email> [password]");
  console.log("Example: node scripts/createAdmin.js john@example.com MyPass123!");
  process.exit(1);
}

const promoteOrCreateAdmin = async () => {
  try {
    await connectDB();
    const cleanEmail = emailArg.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      user.role = "admin";
      user.accountStatus = "active";
      user.isVerified = true;
      await user.save();
      console.log(`\n🎉 Success! Existing user "${user.name}" (${user.email}) has been promoted to ADMIN.`);
    } else {
      const hashedPassword = await bcrypt.hash(passwordArg, 10);
      const usernameSeed = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
      
      user = await User.create({
        name: "Admin",
        email: cleanEmail,
        username: `${usernameSeed}_admin`,
        password: hashedPassword,
        role: "admin",
        accountStatus: "active",
        isVerified: true,
        authProvider: "local",
      });

      console.log(`\n🎉 Success! Created NEW Admin account:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${passwordArg}`);
      console.log(`   Role: ${user.role}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error setting up admin account:", error);
    process.exit(1);
  }
};

void promoteOrCreateAdmin();
