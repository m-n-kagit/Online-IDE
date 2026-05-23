import { type SignOptions } from "jsonwebtoken";
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
declare const generateToken: (entityId: string, options?: GenerateTokenOptions) => string;
export default generateToken;
//# sourceMappingURL=generateToken.d.ts.map