import express, { Application } from "express";
import authRoutes from "./routes/authRoutes";
import fbRoutes from "./routes/fbRoutes";
import { config } from "./config/dotenv";
import cors from "cors";
import cookieSession from "cookie-session";
import awsRoutes from "./routes/awsRoutes";

const app: Application = express();

app.use((req, res, next) => {
	console.log("Incoming origin: ", req.headers.origin);
	next();
});

app.use(
    cors({
        origin: function (origin, callback) {
		const allowedOrigins = [
		    "http://localhost:5173",
		    "http://localhost:3000",
		    "http://127.0.0.1:5173",
		    "http://127.0.0.1:3000",
		    "https://queuesocial.robrust.dev"
		];
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			console.warn("Blocked by CORS:", origin);
			callback(new Error("Blocked by CORS: " + origin));
		}
	},	
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.options("*", cors());

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

// Log all requests
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
});

const router = express.Router();

router.use("/auth", authRoutes);
// Protected routes
// Note: all requests to protected routes will contain a req.userId field
// to identify the request from the verifyToken function
router.use("/fb", fbRoutes);
router.use("/aws", awsRoutes);

app.use(`/api/${config.API_VERSION}`, router);

export default app;
