/**
 * Interactions with the Facebook API
 */

import { config } from "../config/dotenv";
import { fetchJSON } from "../lib/utils";
import { Request, Response } from "express";
import { Post } from "../types";

export default class FacebookService {
    apiUrl: string = config.FACEBOOK_API_URL;

    /**
     * Logs a user into their Facebook account
     * to get access to their pages
     */
    async login(req: Request, res: Response) {
        const fbLoginUrl =
            config.FACEBOOK_LOGIN_URL +
            "/dialog/oauth?" +
            `client_id=${config.FACEBOOK_APP_ID}` +
            `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
            "&scope=pages_manage_metadata,pages_manage_posts,pages_show_list,email,public_profile,pages_manage_engagement,pages_read_engagement" +
            "&response_type=code";

        return res.redirect(fbLoginUrl);
    }

    /**
     * The callback handles successful page connect by
     * saving the page info to the database
     */
    async callback(req: Request, res: Response) {
        const loginCode = req.query.code as string;
        if (!loginCode) console.error("No callback code found");

        const pages = await this.getFacebookPages(loginCode);
        console.log(pages);

        const pageId = pages[1].id;
        const pageAccessToken = pages[1].access_token;

        const pageInfo = await this.getFacebookPagePicture(
            pageId,
            pageAccessToken,
        );
        console.log("Got page info: ", pageInfo);

        return res.status(200).json(pageInfo);
    }

    /**
     * Gets a facebook page's profile picture
     */
    async getFacebookPagePicture(pageId: string, pageAccessToken: string) {
        const url =
            this.apiUrl +
            `/${pageId}?access_token=${pageAccessToken}&fields=picture`;

        const response = await fetchJSON(url);
        return response.picture.data;
    }

    /**
     * Creates a new facebook post for a page that publishes at scheduled_publish_time
     * @param scheduled_publish_time Must be between 30 minutes and 30 days from the time of the request
     * The scheduled publish time must be an integer UNIX timestamp [in seconds],
     * an ISO 8061 timestamp string, or any string parsable by PHP's strtotime()
     */
    async createPost(post: Post) {
        const url = this.apiUrl + `/${post.pageId}/feed`;
        const response = await fetch(url, {
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

        // TODO: If response was successful, add the post to our database

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
     * Gets the user ID associated with the access token
     */
    async getUserId(accessToken: string): Promise<string> {
        const accessTokenInspection =
            await this.inspectAccessToken(accessToken);
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

    /**
     * Gets a user's managed facebook pages
     * Returns an array of facebook pages
     */
    async getFacebookPages(loginCode: string) {
        const userAccessToken =
            await this.exchangeCodeForAccessToken(loginCode);
        const userId = await this.getUserId(userAccessToken);
        const url =
            this.apiUrl +
            `/${userId}/accounts` +
            `?access_token=${userAccessToken}`;

        const pagesData = await fetchJSON(url);
        return pagesData.data || [];
    }
}
