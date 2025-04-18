import mongoose, { Document, Schema } from "mongoose";
import { Post } from "../types";

interface PostDocument extends Post, Document {
    pageIds: string[];
    text: string;
    imageUrl?: string;
    scheduledPublishTime: number; // UNIX timestamp
}

const PostSchema = new Schema({
    pageIds: {
        type: [String],
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    scheduledPublishTime: {
        type: Number,
        required: true,
    },
});

export default mongoose.model<PostDocument>("Post", PostSchema);
