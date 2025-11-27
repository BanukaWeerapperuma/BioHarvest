import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default:"user" },
    cartData: { type: Object, default: {} },
    profileImage: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    preferences: {
      dietary: { type: String, default: "" },
      allergies: { type: String, default: "" },
      notifications: { type: Boolean, default: true }
    },
    stats: {
      orders: { type: Number, default: 0 },
      courses: { type: Number, default: 0 },
      points: { type: Number, default: 0 }
    },
    lastLogin: { type: Date, default: Date.now }
  },
  { minimize: false, timestamps: true }
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
