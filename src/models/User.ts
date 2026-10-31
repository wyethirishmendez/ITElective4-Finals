import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole, type UserDoc } from "../types/index";

// The Session 1 User interface, written a second time as a schema.
const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole), // ["tutor", "tutee"]
      default: UserRole.Tutee,
    },
    isActive: { type: Boolean, default: true },
    // select: false keeps it out of every query unless asked for by name.
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true },
);

// Replaces the plain password with its hash before it is ever written.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

export const User = model<UserDoc>("User", userSchema);
