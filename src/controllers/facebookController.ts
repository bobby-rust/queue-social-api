import { Request, Response } from "express";
import FacebookService from "../services/fbService";
import { Post } from "../types";

// The functions in this class need to be arrow functions or fbService is undefined.
export default class FacebookController {
    constructor(private fbService: FacebookService) { }

    createPost = async (req: Request, res: Response) => {
        const post: Post = req.body;
        console.log("Got post: ", post);
        if (!post.pageIds?.length) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Must provide a page ID",
                },
            });
        }
        if (!post.text && !post.imageUrl) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Must provide either a post text or a post image",
                },
            });
        }

        if (!post.scheduledPublishTime) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Must provide a scheduled publish time",
                },
            });
        }

        // lvl 10 typescripter
        const queueSocialUserId = (req as typeof req & { userId: string })
            .userId;

        let response;
        if (!post.imageUrl) {
            response = await this.fbService.createPost(queueSocialUserId, post);
        } else {
            response = await this.fbService.createPostWithImage(
                queueSocialUserId,
                post,
            );
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
