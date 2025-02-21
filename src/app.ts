import express, { Application } from "express";
import authRoutes from "./routes/authRoutes";
import { config } from "./config/dotenv";

const app: Application = express();
app.use(express.json());

const router = express.Router();
router.use("/auth", authRoutes);

app.use(`/api/${config.API_VERSION}`, router);

export default app;
