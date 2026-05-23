import mongoose, { Schema, type InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
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
  },
  { timestamps: true },
);

export type SessionDocument = InferSchemaType<typeof sessionSchema>;

const Session = mongoose.model("Session", sessionSchema);

export default Session;
