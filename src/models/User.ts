import mongoose, { Document } from "mongoose";

interface IUser extends Document {
    facebookUserId: string;
    username: string;
    email: string;
    password: string;
    profilePicture: string;
    accessToken: string; // Facebook user access token
    pageTokens: { pageId: string; accessToken: string }[];
}

const UserSchema = new mongoose.Schema<IUser>({
    facebookUserId: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    accessToken: { type: String },
    pageTokens: [{ pageId: String, accessToken: String }],
});

export const User = mongoose.model<IUser>("User", UserSchema);
