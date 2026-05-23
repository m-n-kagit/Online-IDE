import jwt, {} from "jsonwebtoken";
import { randomUUID } from "crypto";
const getTokenExpiry = () => (process.env.ACCESS_TOKEN_EXPIRY || "1d");
const generateToken = (entityId, options = {}) => {
    const { purpose = "auth", expiresIn = getTokenExpiry(), jwtid = randomUUID(), payloadRef, } = options;
    const tokenSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!tokenSecret) {
        throw new Error("JWT secret is missing from environment variables");
    }
    const id = entityId || randomUUID();
    const payload = { id, purpose, jwtid };
    if (payloadRef) {
        payloadRef.id = payload.id;
        payloadRef.purpose = payload.purpose;
        payloadRef.jwtid = payload.jwtid;
    }
    const signOptions = { jwtid };
    if (expiresIn !== undefined) {
        signOptions.expiresIn = expiresIn;
    }
    return jwt.sign(payload, tokenSecret, signOptions);
};
export default generateToken;
//# sourceMappingURL=generateToken.js.map