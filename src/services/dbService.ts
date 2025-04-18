import { Page } from "../models/Page";
import Post from "../models/Post";
import { FBPageInfo, IPost } from "../types";
import AWSService from "./awsService";

export default class DatabaseService {
    constructor(private aws: AWSService) { }

    async addPostToDB(post: IPost) {
        console.log("Adding post to db");
        try {
            const result = await Post.create({
                pageIds: post.pageIds,
                text: post.text,
                imageUrl: post.imageUrl || null,
                scheduledPublishTime: post.scheduledPublishTime,
            });
            return result;
        } catch (err) {
            console.error(err);
            return err;
        }
    }

    async getSocialAccountAccessTokenFromDB(
        queueSocialUserId: string,
    ): Promise<string> {
        return "";
    }

    async getPageAccessTokenFromDB(
        pageType: string,
        pageId: string,
        userId: string,
    ): Promise<string> {
        return "";
    }

    async getPagesFromDB(queueSocialUserId: string) {
        const pages = await Page.find({ users: { $in: [queueSocialUserId] } });
        return pages;
    }

    async addPagesToDB(queueSocialUserId: string, pages: FBPageInfo[]) {
        for (const page of pages) {
            await this.addPageToDB(queueSocialUserId, page);
        }
    }

    async addPageToDB(queueSocialUserId: string, page: FBPageInfo) {
        // Get the user
        // Check if the page exists
        // if  the page exists, add the user to the page
        // else, get the page's picture, and add the page to the database

        // Try updating the user's access token in the array
        const result = await Page.updateOne(
            {
                pageId: page.id,
                "users.queueSocialUserId": queueSocialUserId,
            },
            {
                $set: {
                    "users.$.pageAccessToken": page.access_token,
                    name: page.name,
                },
            },
        );

        // If the user wasn't found, push them into the array
        if (result.modifiedCount === 0) {
            await Page.updateOne(
                { pageId: page.id },
                {
                    $setOnInsert: {
                        pageId: page.id,
                        name: page.name,
                    },
                    $push: {
                        users: {
                            queueSocialUserId: queueSocialUserId,
                            pageAccessToken: page.access_token,
                        },
                    },
                },
                { upsert: true },
            );
        }
    }
}
