import { Page } from "../models/Page";
import { FBPageInfo, Post } from "../types";
import AWSService from "./awsService";

export default class DatabaseService {
    constructor(private aws: AWSService) { }

    async addPostToDB(post: Post) { }

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
        console.log(pages);
        return pages;
    }

    async addPagesToDB(
        queueSocialUserId: string,
        pages: (FBPageInfo & { profilePicture: string })[],
    ) {
        for (const page of pages) {
            await this.addPageToDB(queueSocialUserId, page);
        }
    }

    async addPageToDB(
        queueSocialUserId: string,
        page: FBPageInfo & { profilePicture: string },
    ) {
        // Get the user
        // Check if the page exists
        // if  the page exists, add the user to the page
        // else, get the page's picture, and add the page to the database

        // FIXME: I probably shouldn't store profile pictures on AWS,
        // instead just fetch them each time it is needed from the Facebook API
        const imageUrl = await this.aws.uploadImageFromUrl(page.profilePicture);

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
                    profilePicture: imageUrl,
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
                        profilePicture: imageUrl,
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
