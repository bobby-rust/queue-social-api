import { Router } from "express";
import FacebookController from "../controllers/facebookController";

const router = Router();

const fbController = new FacebookController();

router.get("/link", fbController.linkAccount);
router.get("/callback", fbController.callback);
router.post("/create-post", fbController.createPost);
router.get("/accounts/:id", fbController.getAccounts);
export default router;
