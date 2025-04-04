import dotenv from "dotenv";

dotenv.config();

export const config = {
    PORT: process.env.PORT || 3000,
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID!,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET!,
    FACEBOOK_CLIENT_TOKEN: process.env.FACEBOOK_CLIENT_TOKEN!,
    REDIRECT_URI: process.env.REDIRECT_URI!,
    MONGODB_URI: process.env.MONGODB_URI!,
    FACEBOOK_API_URL: process.env.FACEBOOK_API_URL!,
    FACEBOOK_LOGIN_URL: process.env.FACEBOOK_LOGIN_URL!,
    API_VERSION: "v1",
    JWT_SECRET: process.env.JWT_SECRET!,
    COOKIE_SECRET: process.env.COOKIE_SECRET!,
    AWS_KEY: process.env.AWS_KEY!,
    AWS_SECRET: process.env.AWS_SECRET!,
    AWS_REGION: process.env.AWS_REGION!,
    AWS_BUCKET: process.env.AWS_BUCKET!,
};
