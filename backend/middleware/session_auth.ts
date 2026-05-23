import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Session from "../schema/Session.models.js";
import type { SessionTokenPayload } from "../utils/generateToken.js";

const tokenSecret = process.env.ACCESS_TOKEN_SECRET;
const cookieName = process.env.SESSION_COOKIE_NAME || "session_token";

const extractToken = (req: Request) => {
  const authHeader = req.headers.authorization;

  if (req.cookies?.[cookieName]) {
    return req.cookies[cookieName];
  }

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
};

export const requireSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ message: "Session token is missing" });
    }

    if (!tokenSecret) {
      throw new Error("JWT secret is missing from environment variables");
    }

    const decoded = jwt.verify(token, tokenSecret) as SessionTokenPayload;

    if (decoded.purpose !== "session") {
      return res.status(401).json({ message: "Invalid session token purpose" });
    }

    const session = await Session.findOne({ sessionId: decoded.id, tokenId: decoded.jwtid });

    if (!session) {
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return res.status(401).json({ message: "Session is no longer valid" });
    }

    const routeSessionId = req.params.sessionId;

    if (routeSessionId && routeSessionId !== session.sessionId) {
      return res.status(403).json({ message: "Session token does not match the requested session" });
    }

    req.session = {
      sessionId: session.sessionId,
      tokenId: session.tokenId,
    };

    req.auth = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Session token expired" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid session token" });
    }

    const message = error instanceof Error ? error.message : "Failed to authenticate session";
    return res.status(500).json({ message });
  }
};
