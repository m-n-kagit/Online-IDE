import type { Request, Response } from "express";
import Session from "../schema/Session.models.js";
import File, { type FileInput, type FileType } from "../schema/File.models.js";
import generateToken, {
  type GenerateTokenOptions,
  type SessionTokenPayload,
} from "../utils/generateToken.js";

const cookieName = process.env.SESSION_COOKIE_NAME || "session_token";
const cookieMaxAge = Number(process.env.SESSION_COOKIE_MAX_AGE || 7 * 24 * 60 * 60 * 1000);
const cookieSameSite = (process.env.COOKIE_SAME_SITE || "lax") as "lax" | "strict" | "none";

type SessionFilesBody = {
  files?: FileInput[];
};

type SessionParams = {
  sessionId: string;
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || cookieSameSite === "none",
  sameSite: cookieSameSite,
  maxAge: cookieMaxAge,
});

const setSessionCookie = (
  res: Response,
  sessionId: string,
  options: Partial<GenerateTokenOptions> = {},
) => {
  const token = generateToken(sessionId, {
    purpose: "session",
    ...options,
  });

  res.cookie(cookieName, token, getCookieOptions());
  return token;
};

const clearSessionCookie = (res: Response) => {
  res.clearCookie(cookieName, getCookieOptions());
};

const isValidFileType = (value: unknown): value is FileType =>
  value === "file" || value === "directory";

const normalizeFiles = (sessionId: string, files: unknown): FileInput[] => {
  if (!Array.isArray(files)) {
    throw new Error("files must be an array");
  }

  return files.map((file, index) => {
    if (!file || typeof file !== "object") {
      throw new Error(`File at index ${index} must be an object`);
    }

    const candidate = file as Record<string, unknown>;
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const path = typeof candidate.path === "string" ? candidate.path.trim() : "";
    const type = candidate.type;

    if (!name || !path || !isValidFileType(type)) {
      throw new Error(`File at index ${index} requires valid name, path, and type`);
    }

    return {
      sessionId,
      name,
      path,
      type,
      content: typeof candidate.content === "string" ? candidate.content : "",
      language: typeof candidate.language === "string" ? candidate.language : "plaintext",
    };
  });
};

const getSessionFiles = async (sessionId: string) =>
  File.find({ sessionId }).sort({ path: 1, type: 1, createdAt: 1 }).lean();

const serializeSession = (session: {
  sessionId: string;
  tokenId: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}) => ({
  sessionId: session.sessionId,
  tokenId: session.tokenId,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  lastAccessedAt: session.lastAccessedAt,
});

export const createSession = async (_req: Request, res: Response) => {
  try {
    const tokenPayload = {} as SessionTokenPayload;
    const token = setSessionCookie(res, "", {
      purpose: "session",
      payloadRef: tokenPayload,
    });

    const sessionId = tokenPayload.id;
    const tokenId = tokenPayload.jwtid;

    const session = await Session.create({
      sessionId,
      tokenId,
      lastAccessedAt: new Date(),
    });

    return res.status(201).json({
      message: "Session created",
      token,
      session: serializeSession(session),
      files: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create session";
    return res.status(500).json({ message });
  }
};

export const getSession = async (req: Request<SessionParams>, res: Response) => {
  try {
    const sessionId = req.session?.sessionId || req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await Session.findOneAndUpdate(
      { sessionId },
      { lastAccessedAt: new Date() },
      { new: true },
    ).lean();

    if (!session) {
      clearSessionCookie(res);
      return res.status(404).json({ message: "Session not found" });
    }

    const files = await getSessionFiles(sessionId);

    return res.status(200).json({
      session: serializeSession(session),
      files,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load session";
    return res.status(500).json({ message });
  }
};

export const storeSession = async (
  req: Request<SessionParams, {}, SessionFilesBody>,
  res: Response,
) => {
  try {
    const sessionId = req.session?.sessionId || req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const normalizedFiles = normalizeFiles(sessionId, req.body.files);
    const session = await Session.findOne({ sessionId });

    if (!session) {
      clearSessionCookie(res);
      return res.status(404).json({ message: "Session not found" });
    }

    await File.deleteMany({ sessionId });

    if (normalizedFiles.length > 0) {
      await File.insertMany(normalizedFiles, { ordered: true });
    }

    session.lastAccessedAt = new Date();
    await session.save();

    return res.status(200).json({
      message: "Session stored successfully",
      session: serializeSession(session),
      count: normalizedFiles.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to store session";
    const statusCode = message.includes("files") || message.includes("File at index") ? 400 : 500;
    return res.status(statusCode).json({ message });
  }
};

export const deleteSession = async (req: Request<SessionParams>, res: Response) => {
  try {
    const sessionId = req.session?.sessionId || req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    await Promise.all([
      Session.deleteOne({ sessionId }),
      File.deleteMany({ sessionId }),
    ]);

    clearSessionCookie(res);

    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete session";
    return res.status(500).json({ message });
  }
};
