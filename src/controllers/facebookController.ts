import { Request, Response } from "express";
import FacebookService from "../services/fbService";
import { Post } from "../types";

// The functions in this class need to be arrow functions or fbService is undefined.
export default class FacebookController {
    constructor(private fbService: FacebookService) { }

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
            response = await this.fbService.createPostWithImage(post, ""); // TODO: actually pass the page access token
        }
        // TODO: check if response was successful

        return res
            .status(201)
            .json({ data: { success: true, message: "Post scheduled" } });
    };

    linkAccount = async (req: Request, res: Response) => {
        const userId = req.query.userId as string;
        try {
            const response = this.fbService.linkAccount(
                userId,
                (url: string) => {
                    res.redirect(url);
                },
            );
            console.log("FB Login response: ", response);

            return res.status(200).json({ success: true, message: response });
        } catch (err) {
            return res.status(500).json({ success: false, message: err });
        }
    };

    callback = async (req: Request, res: Response) => {
        try {
            this.fbService.callback(req, res);
            return res.status(201).redirect("http://localhost:5173/home");
        } catch (err) {
            return res.status(500).json({ success: false, message: err });
        }
    };

    getPages = async (req: Request, res: Response) => {
        // ID here is queueSocialUserId
        const { id } = req.params;
        console.log("ID: ", id);
        try {
            const pages = await this.fbService.getPagesFromSocialAPI(id);
            const clientPages = await Promise.all(
                pages.map(async (page) => {
                    const img = await this.fbService.getPagePicture(
                        page.id,
                        page.access_token,
                    );
                    return {
                        id: page.id,
                        name: page.name,
                        img: img,
                    };
                }),
            );
            return res
                .status(200)
                .json({ success: true, data: { pages: clientPages } });
        } catch (err) {
            return res.status(500).json({ success: false, message: err });
        }
    };
}
