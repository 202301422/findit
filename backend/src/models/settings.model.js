import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "FindIt",
    },
    logoUrl: {
      type: String,
      default: "",
    },
    bannerText: {
      type: String,
      default: "Welcome to FindIt - Campus Marketplace & Lost & Found",
    },
    supportEmail: {
      type: String,
      default: "support@findit.edu",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    termsOfService: {
      type: String,
      default: "Standard FindIt Terms of Service...",
    },
    privacyPolicy: {
      type: String,
      default: "Standard FindIt Privacy Policy...",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
