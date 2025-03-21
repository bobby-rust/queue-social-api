import { Router } from "express";
import FacebookController from "../controllers/facebookController";

const router = Router();

const fbController = new FacebookController();

router.post("/link", fbController.linkAccount);
router.post("/create-post", fbController.createPost);
export default router;
