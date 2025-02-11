import { Request, Response } from "express";
import { config } from "../config/dotenv";
import {
    exchangeCodeForAccessToken,
    exchangeShortLivedTokenForLongLivedToken,
    getUserPages,
} from "../lib/facebook_api";
import { FacebookLoginResponse } from "../types";

export const login = (_: Request, res: Response) => {
    const facebookAuthUrl =
        "https://www.facebook.com/v20.0/dialog/oauth" +
        `?client_id=${config.FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
        "&scope=pages_manage_posts,pages_read_engagement,pages_show_list";

    console.log("Passing callback uri: ", config.REDIRECT_URI);
    res.redirect(facebookAuthUrl);
};

/**
 * Controller for handling the OAuth callback
 */
export const callback = async (
    req: Request,
    res: Response,
): Promise<FacebookLoginResponse> => {
    console.log("Running callback");
    // Facebook gives a code param in the callback URL
    // which can be used to obtain an access token
    const code: string | undefined = req.query.code as string;

    console.log("Got code: ", code);
    if (!code) {
        res.status(400);
        console.log("Callback code not found");
        return {
            error: "Callback code not found",
        };
    }

    try {
        const shortLivedToken = await exchangeCodeForAccessToken(code);

        const longLivedToken =
            await exchangeShortLivedTokenForLongLivedToken(shortLivedToken);

        const pages = await getUserPages(longLivedToken);

        res.status(200);
        console.log("Returning pages data: ", pages);
        return {
            userAccessToken: longLivedToken,
            pages,
        };
    } catch (error) {
        res.status(500);
        return {
            error: error as string,
        };
    }
};
