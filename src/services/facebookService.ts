/**
 * Interactions with the Facebook API
 */

import { config } from "../config/dotenv";
import { fetchJSON } from "../lib/utils";
import { Request, Response } from "express";
import { FBPageInfo, FBPagePictureData, Post } from "../types";
import { Page } from "../models/Page";
import AWSService from "./awsService";

export default class FacebookService {
    apiUrl: string = config.FACEBOOK_API_URL;

    /**
     * Logs a user into their Facebook account
     * to get access to their pages
     */
    async login(res: Response, userId: string) {
        const fbLoginUrl =
            config.FACEBOOK_LOGIN_URL +
            "/dialog/oauth?" +
            `client_id=${config.FACEBOOK_APP_ID}` +
            `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
            "&scope=pages_manage_metadata,pages_manage_posts,pages_show_list,email,public_profile,pages_manage_engagement,pages_read_engagement" +
            `&response_type=code&state=${userId}`;

        console.log(fbLoginUrl);

        return res.redirect(fbLoginUrl);
    }

    /**
     * The callback handles successful page connect by
     * saving the page info to the database
     */
    async callback(req: Request, res: Response) {
        const userId = req.query.state as string;
        const loginCode = req.query.code as string;
        if (!loginCode) console.error("No callback code found");
        const userAccessToken =
            await this.exchangeCodeForAccessToken(loginCode);
        const pages = await this.getFacebookPages(userAccessToken);
        console.log(pages);

        try {
            await this.addPagesToDb(pages, userId);
        } catch (err) {
            console.error("Failed to add page to database: ", err);
            return err;
        }

        return res.status(200).json(pages);
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

        const pagePicture = await this.getFacebookPagePicture(
            pageId,
            pageAccessToken,
        );

        console.log(pagePicture);

        const imageUrl = await this.uploadImageToAWS(pagePicture.url);

        await Page.findOneAndUpdate(
            { pageId: page.id },
            {
                $set: {
                    pageId: page.id,
                    name: page.name,
                    profilePicture: imageUrl,
                },
                $addToSet: {
                    users: {
                        userId: userId,
                        pageAccessToken: page.access_token,
                    },
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    }

    /**
     * Gets a facebook page's profile picture
     */
    async getFacebookPagePicture(
        pageId: string,
        pageAccessToken: string,
    ): Promise<FBPagePictureData> {
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
    async createPost(post: Post, pageAccessToken: string) {
        const url =
            this.apiUrl +
            `/${post.pageId}/feed?access_token=${pageAccessToken}`;
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
    async createPostWithImage(post: Post) {
        if (!post.imageUrl) {
            throw new Error("Must supply an image");
        }

        const url = this.apiUrl + `/${post.pageId}/photos`;
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
    async getFacebookPages(userAccessToken: string) {
        const userId = await this.getUserId(userAccessToken);
        const url =
            this.apiUrl +
            `/${userId}/accounts` +
            `?access_token=${userAccessToken}`;

        const pagesData = await fetchJSON(url);
        return pagesData.data || [];
    }
}
