import { Router } from "express";
import AWSController from "../controllers/awsController";
import multer from "multer";
import { verifyToken } from "../middleware/authJwt";

const awsRouter = Router();
const awsController = new AWSController();
const upload = multer({ storage: multer.memoryStorage() });

awsRouter.post(
    "/upload",
    verifyToken,
    upload.single("image"),
    awsController.uploadImage,
);

export default awsRouter;
