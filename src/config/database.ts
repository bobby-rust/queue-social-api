import mongoose from "mongoose";
import { config } from "../config/dotenv";

export const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log("Database connected");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};
