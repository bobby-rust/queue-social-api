import mongoose, { Document } from "mongoose";

interface User extends Document {
    facebookUserId: string;
    username: string;
    email: string;
    password: string;
    profilePicture: string;
    fbUserAccessToken: string;
    pageTokens: { pageId: string; accessToken: string }[];
}

const UserSchema = new mongoose.Schema<User>({
    facebookUserId: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    fbUserAccessToken: { type: String },
    pageTokens: [{ pageId: String, accessToken: String }],
});

export const User = mongoose.model<User>("User", UserSchema);
