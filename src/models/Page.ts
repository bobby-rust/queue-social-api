import mongoose from "mongoose";

const PageScheme = new mongoose.Schema({
    pageId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profilePicture: { type: String },
    users: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            pageAccessToken: { type: String, required: true }, // Unique per user
        },
    ],
});
