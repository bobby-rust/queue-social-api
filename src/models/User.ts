import mongoose, { Document } from "mongoose";

interface IUser extends Document {
    facebookUserId: string;
    name: string;
    email: string;
    profilePicture: string;
    accessToken: string;
    pageTokens: { pageId: string; accessToken: string }[];
}

const UserSchema = new mongoose.Schema<IUser>({
    facebookUserId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profilePicture: { type: String },
    accessToken: { type: String },
    pageTokens: [{ pageId: String, accessToken: String }],
});

export const User = mongoose.model<IUser>("User", UserSchema);
