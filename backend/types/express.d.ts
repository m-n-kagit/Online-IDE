import type { SessionTokenPayload } from "../utils/generateToken.js";

declare global {
  namespace Express {
    interface Request {
      auth?: SessionTokenPayload;
      session?: {
        sessionId: string;
        tokenId: string;
      };
    }
  }
}

export {};
