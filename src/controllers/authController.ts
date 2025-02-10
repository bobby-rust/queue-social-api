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
        "https://www.facebook.com/v19.0/dialog/oauth" +
        `?client_id=${config.FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
        "&scope=pages_manage_posts,pages_read_engagement,pages_show_list";

    res.redirect(facebookAuthUrl);
};

/**
 * Controller for handling the OAuth callback
 */
export const callback = async (
    req: Request,
    res: Response,
): Promise<FacebookLoginResponse> => {
    const { code } = req.query;

    if (!code) {
        res.status(400);
        return {
            error: "Callback code not found",
        };
    }

    try {
        const shortLivedToken = await exchangeCodeForAccessToken(
            code as string,
        );

        const longLivedToken =
            await exchangeShortLivedTokenForLongLivedToken(shortLivedToken);

        const pages = await getUserPages(longLivedToken);

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
