import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import sessionRouter from "./routes/session.routes.js";
const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/webcontainer";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/sessions", sessionRouter);
mongoose
    .connect(MONGODB_URI)
    .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown MongoDB connection error";
    console.error("MongoDB connection error:", message);
});
//# sourceMappingURL=server.js.map