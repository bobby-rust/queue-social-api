/**
 * Interactions with the Facebook API
 */

import { config } from "../config/dotenv";
import { fetchJSON } from "../lib/utils";
import { Request, Response } from "express";
import {
    FBPageInfo,
    FBPagePictureData,
    PageResponse,
    Post,
    SocialProvider,
} from "../types";
import { Page } from "../models/Page";
import AWSService from "./awsService";
import { User } from "../models/User";
import DatabaseService from "./dbService";

export default class FacebookService implements SocialProvider {
    apiUrl: string = config.FACEBOOK_API_URL;

    constructor(private dbService: DatabaseService) { }

    linkAccount(
        queueSocialUserId: string,
        redirect: (url: string) => void,
    ): void {
        this.login(queueSocialUserId, redirect);
    }

    /**
     * Logs a user into their Facebook account
     * to get access to their pages
     */
    private async login(
        queueSocialUserId: string,
        redirect: (url: string) => void,
    ) {
        console.log("Got user id forlogin request: ", queueSocialUserId);
        const fbLoginUrl =
            config.FACEBOOK_LOGIN_URL +
            "/dialog/oauth?" +
            `client_id=${config.FACEBOOK_APP_ID}` +
            `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
            "&scope=pages_manage_metadata,pages_manage_posts,pages_show_list,email,public_profile,pages_manage_engagement,pages_read_engagement" +
            `&response_type=code&state=${queueSocialUserId}`;

        return redirect(fbLoginUrl);
    }

    /**
     * The callback handles successful page connect by
     * saving the page info to the database
     */
    async callback(req: Request, res: Response) {
        const queueSocialUserId = req.query.state as string;
        console.log("Got queueSocialUserId in callback: ", queueSocialUserId);
        const loginCode = req.query.code as string;
        if (!loginCode) console.error("No callback code found");
        const fbUserAccessToken =
            await this.exchangeCodeForAccessToken(loginCode);
        const accessTokenInfo =
            await this.inspectAccessToken(fbUserAccessToken);
        console.log("Access token info : ", accessTokenInfo);
        const fbUserId = accessTokenInfo.user_id;

        const pages = await this.getPagesFromSocialAPI(
            queueSocialUserId,
            fbUserId,
            fbUserAccessToken,
        );
        console.log("Pages: ", pages);

        try {
            console.log("queueSocialUserId: ", queueSocialUserId);
            await this.addPagesToDb(pages, queueSocialUserId);
            await User.findOneAndUpdate(
                { _id: queueSocialUserId },
                {
                    $set: {
                        fbUserAccessToken: fbUserAccessToken,
                        fbUserId: fbUserId,
                    },
                },
            );
        } catch (err) {
            console.error("Failed to add page to database: ", err);
            return err;
        }
    }

    /**
     * Gets a user's managed facebook pages
     * Returns an array of facebook pages
     */
    async getPagesFromSocialAPI(
        queueSocialUserId: string,
        // If we already have the fbUserId, we can pass it here
        fbUserId?: string,
        // When calling from the callback function of the Facebook Login process,
        // we already have the fbAccessToken, so no need to re-retrieve it. Instead,
        // accept optional parameters
        fbUserAccessToken?: string,
    ): Promise<FBPageInfo[]> {
        if (!fbUserAccessToken) {
            fbUserAccessToken =
                await this.getSocialAccountAccessToken(queueSocialUserId);
            if (!fbUserAccessToken) {
                throw new Error(
                    "Failed to get pages from database. Could not find Facebook account access token.",
                );
            }
        }

        console.log("Got account access token: ", fbUserAccessToken);
        // TODO: This user ID can be retrieved from the database instead
        if (!fbUserId) {
            fbUserId =
                await this.getSocialAccountUserIdFromAccessToken(
                    fbUserAccessToken,
                );
            console.log("FB ID: ", fbUserId);
            if (!fbUserId) {
                throw new Error("Failed to get Facebook User ID");
            }
        }
        const url =
            this.apiUrl +
            `/${fbUserId}/accounts?access_token=${fbUserAccessToken}`;
        console.log("URL :", url);
        const pagesData = await fetchJSON(url);
        console.log("Retrieved Pages Data: ", pagesData);

        return pagesData.data || [];
    }

    private async addPagesToDb(pages: FBPageInfo[], userId: string) {
        for (const page of pages) {
            await this.addPageToDb(page, userId);
        }
    }

    private async uploadImageToAWS(imageUrl: string) {
        const aws = new AWSService();
        const awsImgUrl = await aws.uploadImageFromUrl(imageUrl);

        return awsImgUrl;
    }

    private async addPageToDb(page: FBPageInfo, userId: string) {
        // Get the user
        // Check if the page exists
        // if  the page exists, add the user to the page
        // else, get the page's picture, and add the page to the database

        const pageId = page.id;
        const pageAccessToken = page.access_token;

        const pagePicture = await this.getPagePicture(pageId, pageAccessToken);

        console.log(pagePicture);

        const imageUrl = await this.uploadImageToAWS(pagePicture);

        // Try updating the user's access token in the array
        const result = await Page.updateOne(
            {
                pageId: page.id,
                "users.userId": userId,
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
                            userId: userId,
                            pageAccessToken: page.access_token,
                        },
                    },
                },
                { upsert: true },
            );
        }
    }

    /**
     * Gets a facebook page's profile picture from the Facebook API
     */
    async getPagePicture(
        pageId: string,
        pageAccessToken: string,
    ): Promise<string> {
        const url =
            this.apiUrl +
            `/${pageId}?access_token=${pageAccessToken}&fields=picture`;

        const response = await fetchJSON(url);
        return response.picture.data.url;
    }

    /**
     * Creates a new facebook post for a page that publishes at scheduled_publish_time
     * @param scheduled_publish_time Must be between 30 minutes and 30 days from the time of the request
     * The scheduled publish time must be an integer UNIX timestamp [in seconds],
     * an ISO 8061 timestamp string, or any string parsable by PHP's strtotime()
     */
    async createPost(queueSocialUserId: string, post: Post) {
        const pageAccessToken = await this.getSocialPageAccessTokenFromDB(
            queueSocialUserId,
            post.pageIds[0],
        );

        const url =
            this.apiUrl +
            `/${post.pageIds[0]}/feed?access_token=${pageAccessToken}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: post.text,
                published: true,
                scheduled_publish_time: post.scheduledPublishTime,
            }),
        });

        // TODO: If response was successful, add the post to our database

        console.log(response);
        return response;
    }

    /**
     * Publishes a Facebook post with an image.
     *
     * To publish an Facebook post with an image using the Facebook API,
     * you send a POST request to the photos endpoint. Yes, a photo is a post.
     * No, there is no such thing as a feed post with a photo... that's just a photo post.
     *
     * https://developers.facebook.com/docs/pages-api/posts/
     */
    async createPostWithImage(queueSocialUserId: string, post: Post) {
        if (!post.imageUrl) {
            throw new Error("Must supply an image");
        }

        const pageAccessToken = await this.getSocialPageAccessTokenFromDB(
            queueSocialUserId,
            post.pageIds[0],
        );

        const url =
            this.apiUrl +
            `/${post.pageIds[0]}/photos?access_token=${pageAccessToken}`;
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                message: post.text,
                url: post.imageUrl,
            }),
        });

        console.log(response);
        return response;
    }

    /**
     * Gets an app access token
     * App access tokens are sensitive and must never be exposed client side
     */
    async getAppAccessToken(): Promise<string> {
        const url =
            config.FACEBOOK_API_URL +
            "/oauth/access_token" +
            `?client_id=${config.FACEBOOK_APP_ID}` +
            `&client_secret=${config.FACEBOOK_APP_SECRET}` +
            "&grant_type=client_credentials";

        const response = await fetchJSON(url);
        return response.access_token;
    }

    /**
     * Returns information about an access token
     */
    async inspectAccessToken(accessToken: string): Promise<any> {
        const appAccessToken = await this.getAppAccessToken();
        const url =
            this.apiUrl +
            "/debug_token" +
            `?input_token=${accessToken}` +
            `&access_token=${appAccessToken}`;

        const response = await fetchJSON(url);
        return response.data;
    }

    /**
     * Gets the Facebook user ID associated with the access token
     */
    async getSocialAccountUserIdFromAccessToken(
        socialAccountAccessToken: string,
    ): Promise<string> {
        const accessTokenInspection = await this.inspectAccessToken(
            socialAccountAccessToken,
        );
        console.log("Access token inspection: ", accessTokenInspection);
        return accessTokenInspection.user_id;
    }

    /**
     * Returns a long-lived user access token (expires in ~60 days)
     */
    async exchangeCodeForAccessToken(code: string): Promise<string> {
        const url =
            this.apiUrl +
            "/oauth/access_token?" +
            `client_id=${config.FACEBOOK_APP_ID}` +
            `&redirect_uri=${config.REDIRECT_URI}` +
            `&client_secret=${config.FACEBOOK_APP_SECRET}` +
            `&code=${code}`;

        const response = await fetchJSON(url);
        return response.access_token;
    }

    // Returns an access token to the social media page matching the pageId
    private async getSocialPageAccessTokenFromDB(
        queueSocialUserId: string,
        pageId: string,
    ) {
        const page = await Page.findOne(
            { pageId, "users.userId": queueSocialUserId },
            { "users.$": 1 },
        );

        console.log("Got page: ", page);

        const token = page?.users?.[0]?.pageAccessToken;
        console.log("Got page acecss otken: ", token);
        return token;
    }

    async getSocialAccountAccessToken(
        queueSocialUserId: string,
    ): Promise<string | undefined> {
        const user = await User.findOne({ _id: queueSocialUserId });

        return user?.fbUserAccessToken;
    }

    async getSocialAccountUserIdFromDB(queueSocialUserId: string) {
        return "";
    }

    async getPagesFromDB(queueSocialUserId: string) { }
}
