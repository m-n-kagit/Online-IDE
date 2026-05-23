import mongoose, { Schema } from "mongoose";
const sessionSchema = new Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
    },
    tokenId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
const Session = mongoose.model("Session", sessionSchema);
export default Session;
//# sourceMappingURL=Session.models.js.map