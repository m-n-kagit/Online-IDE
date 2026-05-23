import mongoose, { Schema, type InferSchemaType } from "mongoose";

const fileSchema = new Schema(
  {
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
  },
  { timestamps: true },
);

fileSchema.index({ sessionId: 1, path: 1 }, { unique: true });

export type FileDocument = InferSchemaType<typeof fileSchema>;
export type FileType = FileDocument["type"];
export type FileInput = Pick<
  FileDocument,
  "sessionId" | "name" | "path" | "type" | "content" | "language"
>;

const File = mongoose.model("File", fileSchema);

export default File;
