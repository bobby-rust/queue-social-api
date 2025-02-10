import dotenv from "dotenv";
dotenv.config();

export const config = {
    PORT: process.env.PORT || 3000,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID!,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET!,
    REDIRECT_URI: process.env.REDIRECT_URI!,
};
