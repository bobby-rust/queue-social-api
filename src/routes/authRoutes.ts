import { Router } from "express";
import { login, signUp, logout } from "../controllers/authController";

const router = Router();

router.post("/login", login);
router.post("/signup", signUp);
router.post("/logout", logout);

export default router;
