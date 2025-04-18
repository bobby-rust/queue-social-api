import mongoose, { Document, Schema } from "mongoose";
import { IPost } from "../types";

interface PostDocument extends IPost, Document {
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
