import mongoose from "mongoose";
import bcrypt from "bcryptjs";

interface IApiKey {
  _id: mongoose.Schema.Types.ObjectId;
  exchange_id: mongoose.Schema.Types.ObjectId;
  encrypted_key: string;
  encrypted_secret: string;
}

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  api_keys: IApiKey[];
  matchPassword(password: string): Promise<boolean>;
}

const apiKeySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    exchange_id: { type: mongoose.Schema.Types.ObjectId, ref: "Exchange" },
    encrypted_key: { type: String, required: true },
    encrypted_secret: { type: String, required: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    api_keys: [apiKeySchema],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
