import { Request, Response } from "express";
import FacebookService from "../services/facebookService";
import { Post } from "../types";

export default class FacebookController {
    fbService = new FacebookService();

    async createPost(req: Request, res: Response) {
        const { pageId, text, imageUrl, scheduledPublishTime } = req.body;
        if (!pageId) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Must provide a page ID",
                },
            });
        }
        if (!text && !imageUrl) {
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

        const post: Post = {
            pageId: pageId,
            text: text,
            imageUrl: imageUrl,
            scheduledPublishTime: scheduledPublishTime,
        };

        let response;
        if (!post.imageUrl) {
            response = await this.fbService.createPost(post);
        } else {
            response = await this.fbService.createPostWithImage(post);
        }
        // TODO: check if response was successful

        return res
            .status(201)
            .json({ data: { success: true, message: "Post scheduled" } });
    }

    async linkAccount(req: Request, res: Response) {
        const response = await this.fbService.login(res.redirect);
    }
}
