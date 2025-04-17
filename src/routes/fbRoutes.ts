import { Router } from "express";
import { fbController } from "../container";
import { verifyToken } from "../middleware/authJwt";

const router = Router();

// Callback is called from Facebook's domain, and so won't contain our JWT cookie
router.get("/callback", fbController.callback);
// Protected
router.get("/link", verifyToken, fbController.linkAccount);
router.post("/create-post", verifyToken, fbController.createPost);
router.get("/accounts/:id", verifyToken, fbController.getPages);
export default router;
