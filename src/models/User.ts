import mongoose from "mongoose";
import bcrypt from "bcryptjs";

interface IApiKey {
  _id: mongoose.Schema.Types.ObjectId;
  exchangeId: mongoose.Schema.Types.ObjectId;
  accessKey: string;
  secretKey: string;
}

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  apiKeys: IApiKey[];
  matchPassword(password: string): Promise<boolean>;
}

const apiKeySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    exchangeId: { type: mongoose.Schema.Types.ObjectId, ref: "Exchange" },
    accessKey: { type: String, required: true },
    secretKey: { type: String, required: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    apiKeys: [apiKeySchema],
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
