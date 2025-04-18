import mongoose, { Document } from "mongoose";

interface Page extends Document {
    pageId: string;
    name: string;
    users: { userId: string; pageAccessToken: string }[];
}

const PageSchema = new mongoose.Schema<Page>({
    pageId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    users: [
        {
            queueSocialUserId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            pageAccessToken: { type: String, required: true },
        },
    ],
});

export const Page = mongoose.model<Page>("Page", PageSchema);
