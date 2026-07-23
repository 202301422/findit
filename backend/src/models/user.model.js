import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: {
    type: String,
    default: ""
  },

  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username cannot exceed 30 characters"],
    match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
  },

  avatar: {
    type: String,
    default: ""
  },

  avatarPublicId: {
    type: String,
    default: ""
  },

  bio: {
    type: String,
    default: "",
    maxlength: [500, "Bio cannot exceed 500 characters"]
  },

  college: {
    type: String,
    default: "",
    maxlength: [100, "College name cannot exceed 100 characters"]
  },

  city: {
    type: String,
    default: "",
    maxlength: [100, "City cannot exceed 100 characters"]
  },

  state: {
    type: String,
    default: "",
    maxlength: [100, "State cannot exceed 100 characters"]
  },

  country: {
    type: String,
    default: "",
    maxlength: [100, "Country cannot exceed 100 characters"]
  },

  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  
  password: {
    type: String,
    select: false
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  otp: String,

  otpExpiry: Date,

  resetPasswordOtp: String,

  resetPasswordOtpExpiry: Date,

  verificationExpiresAt: Date,

  accountStatus: {
    type: String,
    enum: ["active", "suspended", "banned", "deleted"],
    default: "active"
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  lastLogin: {
    type: Date,
    default: Date.now
  },

  accessToken: {
    type: String
  },

  refreshToken: {
    type: String
  },

  savedPosts: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      itemType: {
        type: String,
        enum: ["sell", "found", "ticket", "pass"],
        required: true
      },
      savedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, { timestamps: true });

userSchema.index({ verificationExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("User", userSchema);