import mongoose, { type InferSchemaType } from "mongoose";
declare const fileSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type FileDocument = InferSchemaType<typeof fileSchema>;
export type FileType = FileDocument["type"];
export type FileInput = Pick<FileDocument, "sessionId" | "name" | "path" | "type" | "content" | "language">;
declare const File: mongoose.Model<{
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    sessionId: string;
    type: "file" | "directory";
    name: string;
    path: string;
    content: string;
    language: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default File;
//# sourceMappingURL=File.models.d.ts.map