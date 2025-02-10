import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    facebookUserId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profilePicture: { type: String },
    accessToken: { type: String },
    pageTokens: [{ pageId: String, accessToken: String }],
});

export const User = mongoose.model("User", UserSchema);
