import { Request, Response } from "express";
import AWSService from "../services/awsService";

export default class AWSController {
    aws = new AWSService();

    uploadImage = async (req: Request, res: Response) => {
        console.log(req);
        if (!req.file) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "No file received",
                },
            });
        }

        try {
            const imageUrl = await this.aws.upload(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
            );

            return res.status(200).json({
                data: {
                    success: true,
                    message: "File successfully uploaded",
                    fileUrl: imageUrl,
                },
            });
        } catch (e) {
            console.error("Error uploading: ", e);
            return res.status(500).json({
                data: {
                    success: false,
                    message: "Internal server error",
                    error: e,
                },
            });
        }
    };
}
