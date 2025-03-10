import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { User } from "../../models/User";
import { unAuthorized } from "../../utils/httpResponses";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as jwt.Secret);

      req.user = await User.findById((decoded as any).id).select("-password");
      next();
    } catch (error) {
      unAuthorized(res, { message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    unAuthorized(res, { message: "Not authorized, no token" });
  }
};
