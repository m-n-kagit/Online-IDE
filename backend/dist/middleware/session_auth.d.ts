import type { NextFunction, Request, Response } from "express";
export declare const requireSession: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=session_auth.d.ts.map