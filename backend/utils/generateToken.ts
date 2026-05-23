import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";

const getTokenExpiry = () =>
  (process.env.ACCESS_TOKEN_EXPIRY || "1d") as SignOptions["expiresIn"];

export type SessionTokenPayload = {
  id: string;
  purpose: "session" | "auth";
  jwtid: string;
};

export type GenerateTokenOptions = {
  purpose?: SessionTokenPayload["purpose"];
  expiresIn?: SignOptions["expiresIn"];
  jwtid?: string;
  payloadRef?: Partial<SessionTokenPayload>;
};

const generateToken = (entityId: string, options: GenerateTokenOptions = {}) => {
  const {
    purpose = "auth",
    expiresIn = getTokenExpiry(),
    jwtid = randomUUID(),
    payloadRef,
  } = options;

  const tokenSecret = process.env.ACCESS_TOKEN_SECRET;

  if (!tokenSecret) {
    throw new Error("JWT secret is missing from environment variables");
  }

  const id = entityId || randomUUID();
  const payload: SessionTokenPayload = { id, purpose, jwtid };

  if (payloadRef) {
    payloadRef.id = payload.id;
    payloadRef.purpose = payload.purpose;
    payloadRef.jwtid = payload.jwtid;
  }

  const signOptions: SignOptions = { jwtid };

  if (expiresIn !== undefined) {
    signOptions.expiresIn = expiresIn;
  }

  return jwt.sign(payload, tokenSecret, signOptions);
};

export default generateToken;
