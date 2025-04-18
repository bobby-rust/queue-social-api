/**
 * Interactions with the Facebook API
 */

import { config } from "../config/dotenv";
import { fetchJSON } from "../lib/utils";
import { Request, Response } from "express";
import { FBPageInfo, SocialProvider } from "../types";
import { IPost } from "../types";
import { Page } from "../models/Page";
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
        const loginCode = req.query.code as string;
        if (!loginCode) console.error("No callback code found");
        const fbUserAccessToken =
            await this.exchangeCodeForAccessToken(loginCode);
        const accessTokenInfo =
            await this.inspectAccessToken(fbUserAccessToken);
        const fbUserId = accessTokenInfo.user_id;

        const pages = await this.getPagesFromSocialAPI(
            queueSocialUserId,
            fbUserId,
            fbUserAccessToken,
        );

        try {
            await this.dbService.addPagesToDB(queueSocialUserId, pages);
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

        // TODO: This user ID can be retrieved from the database instead
        if (!fbUserId) {
            fbUserId =
                await this.getSocialAccountUserIdFromAccessToken(
                    fbUserAccessToken,
                );
            if (!fbUserId) {
                throw new Error("Failed to get Facebook User ID");
            }
        }
        const url =
            this.apiUrl +
            `/${fbUserId}/accounts?access_token=${fbUserAccessToken}`;
        const pagesData = await fetchJSON(url);

        return pagesData.data || [];
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
    async createPost(queueSocialUserId: string, post: IPost) {
        let response = new Response();
        for (const pageId of post.pageIds) {
            const pageAccessToken = await this.getSocialPageAccessTokenFromDB(
                queueSocialUserId,
                pageId,
            );

            console.log(
                "Scheduling post for timestamp: ",
                post.scheduledPublishTime,
            );

            const url =
                this.apiUrl + `/${pageId}/feed?access_token=${pageAccessToken}`;
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: post.text,
                    published: false,
                    scheduled_publish_time: post.scheduledPublishTime,
                }),
            });

            console.log("Facebook API create post response: ", response);
        }
        // Only add the post to the db once
        const result = await this.dbService.addPostToDB(post);
        console.log("Add post to db result: ", result);
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
    async createPostWithImage(queueSocialUserId: string, post: IPost) {
        if (!post.imageUrl) {
            throw new Error("Must supply an image");
        }

        let response = new Response();
        for (const pageId of post.pageIds) {
            const pageAccessToken = await this.getSocialPageAccessTokenFromDB(
                queueSocialUserId,
                pageId,
            );

            // The photos endpoint requires FormData, JSON is invalid
            const form = new FormData();
            form.append("message", post.text);
            form.append("url", post.imageUrl);
            form.append("published", "false");
            form.append(
                "scheduled_publish_time",
                post.scheduledPublishTime.toString(),
            );

            const url =
                this.apiUrl +
                `/${pageId}/photos?access_token=${pageAccessToken}`;
            response = await fetch(url, {
                method: "POST",
                body: form,
            });

            console.log("Facebook API create post response: ", response);
        }
        // Only add the post to the db once
        const result = await this.dbService.addPostToDB(post);
        console.log("Add post to db result: ", result);
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
        console.log("Finding page: ", pageId);
        console.log("With user: ", queueSocialUserId);
        const page = await Page.findOne(
            { pageId, "users.queueSocialUserId": queueSocialUserId },
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

    async getPostsFromDB(queueSocialUserId: string) {
        const posts = await this.dbService.getPostsFromDB(queueSocialUserId);
        return posts;
    }
}
