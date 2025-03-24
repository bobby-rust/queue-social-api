import { Router } from "express";
import AWSController from "../controllers/awsController";
import multer from "multer";

const awsRouter = Router();
const awsController = new AWSController();
const upload = multer({ storage: multer.memoryStorage() });

awsRouter.post("/upload", upload.single("image"), awsController.uploadImage);

export default awsRouter;
