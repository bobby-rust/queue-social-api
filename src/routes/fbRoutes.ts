import { Router } from "express";
import { fbController } from "../container";

const router = Router();

router.get("/link", fbController.linkAccount);
router.get("/callback", fbController.callback);
router.post("/create-post", fbController.createPost);
router.get("/accounts/:id", fbController.getAccounts);
export default router;
