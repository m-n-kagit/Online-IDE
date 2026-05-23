import type { Request, Response } from "express";
import { type FileInput } from "../schema/File.models.js";
type SessionFilesBody = {
    files?: FileInput[];
};
type SessionParams = {
    sessionId: string;
};
export declare const createSession: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSession: (req: Request<SessionParams>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const storeSession: (req: Request<SessionParams, {}, SessionFilesBody>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSession: (req: Request<SessionParams>, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=sessioncontroller.d.ts.map