import mongoose, { Schema } from "mongoose";
const fileSchema = new Schema({
    sessionId: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["file", "directory"],
        required: true,
    },
    path: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        default: "",
    },
    language: {
        type: String,
        default: "plaintext",
    },
}, { timestamps: true });
fileSchema.index({ sessionId: 1, path: 1 }, { unique: true });
const File = mongoose.model("File", fileSchema);
export default File;
//# sourceMappingURL=File.models.js.map