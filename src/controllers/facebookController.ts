import { Request, Response } from "express";
import FacebookService from "../services/facebookService";
import { Post } from "../types";

// The functions in this class need to be arrow functions or fbService is undefined.
// Don't ask me why.
export default class FacebookController {
    fbService = new FacebookService();

    createPost = async (req: Request, res: Response) => {
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
            response = await this.fbService.createPost(post, ""); // TODO: actually pass the page access token
        } else {
            response = await this.fbService.createPostWithImage(post);
        }
        // TODO: check if response was successful

        return res
            .status(201)
            .json({ data: { success: true, message: "Post scheduled" } });
    };

    linkAccount = async (req: Request, res: Response) => {
        const response = await this.fbService.login(res);

        return response;
    };

    callback = async (req: Request, res: Response) => {
        return this.fbService.callback(req, res);
    };
}
