import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as jwt.Secret, {
    expiresIn: process.env.JWT_LIFE as StringValue,
  });
};
