import { Router } from "express";
import { createSession, deleteSession, getSession, storeSession, } from "../controller/sessioncontroller.js";
import { requireSession } from "../middleware/session_auth.js";
const sessionRouter = Router();
sessionRouter.post("/", createSession);
sessionRouter.get("/current", requireSession, getSession);
sessionRouter.get("/:sessionId", requireSession, getSession);
sessionRouter.put("/:sessionId/files", requireSession, storeSession);
sessionRouter.delete("/:sessionId", requireSession, deleteSession);
export default sessionRouter;
//# sourceMappingURL=session.routes.js.map