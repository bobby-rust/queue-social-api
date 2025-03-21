import { Request, Response } from "express";
import { config } from "../config/dotenv";
import FacebookService from "../services/facebookService";

export default class FacebookController {
    fbService = new FacebookService();

    async createPost(req: Request, res: Response) {
        const { pageId, text, image, scheduledPublishTime } = req.body;
        if (!pageId) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Must provide a page ID",
                },
            });
        }
        if (!text && !image) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Must provide either a post text or a post image",
                },
            });
        }

        if (!scheduledPublishTime) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Must provide a scheduled publish time",
                },
            });
        }

        const post = {
            pageId: pageId,
            text: text,
            image: image,
            scheduledPublishTime: scheduledPublishTime,
        };

        const response = await this.fbService.createPost(post);
        // TODO: check if response was successful

        return res
            .status(201)
            .json({ data: { success: true, message: "Post scheduled" } });
    }
}
