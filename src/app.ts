import express, { Application } from "express";
import authRoutes from "./routes/authRoutes";
import fbRoutes from "./routes/fbRoutes";
import { config } from "./config/dotenv";
import cors from "cors";
import cookieSession from "cookie-session";
import awsRoutes from "./routes/awsRoutes";

const app: Application = express();

app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:3000"], // Add frontend & API server
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

// Parse requests of content-type application/json
app.use(express.json());
// Parse requests of content-type application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
    cookieSession({
        name: "queue-social-session",
        keys: [config.COOKIE_SECRET],
        httpOnly: false,
        sameSite: "strict",
    }),
);

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/fb", fbRoutes);
router.use("/aws", awsRoutes);

app.use(`/api/${config.API_VERSION}`, router);

export default app;
