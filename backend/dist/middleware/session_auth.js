import jwt from "jsonwebtoken";
import Session from "../schema/Session.models.js";
const cookieName = process.env.SESSION_COOKIE_NAME || "session_token";
const getCookieSameSite = () => (process.env.COOKIE_SAME_SITE || "lax");
const getClearCookieOptions = () => {
    const sameSite = getCookieSameSite();
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || sameSite === "none",
        sameSite,
    };
};
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (req.cookies?.[cookieName]) {
        return req.cookies[cookieName];
    }
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return undefined;
};
export const requireSession = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: "Session token is missing" });
        }
        const tokenSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!tokenSecret) {
            console.error("ACCESS_TOKEN_SECRET is missing from environment variables");
            return res.status(401).json({ message: "Session authentication is not configured" });
        }
        const decoded = jwt.verify(token, tokenSecret);
        if (decoded.purpose !== "session") {
            return res.status(401).json({ message: "Invalid session token purpose" });
        }
        const session = await Session.findOne({ sessionId: decoded.id, tokenId: decoded.jwtid });
        if (!session) {
            res.clearCookie(cookieName, getClearCookieOptions());
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
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Session token expired" });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid session token" });
        }
        console.error("Session authentication error:", error);
        return res.status(401).json({ message: "Failed to authenticate session" });
    }
};
//# sourceMappingURL=session_auth.js.map