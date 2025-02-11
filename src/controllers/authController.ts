import { Request, Response } from "express";
import { config } from "../config/dotenv";
import { FacebookLoginResponse } from "../types";
import { exchangeCodeForAccessToken } from "../lib/facebook_api";

export function login(req: Request, res: Response) {
    const fbLoginUrl =
        config.FACEBOOK_LOGIN_URL +
        "/dialog/oauth?" +
        `client_id=${config.FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
        "&scope=pages_manage_posts,pages_show_list,email,public_profile" +
        "&response_type=code";

    return res.redirect(fbLoginUrl);
}

export async function callback(req: Request, res: Response) {
    console.log("In callback");
    const code: string = req.query.code as string;
    console.log("Got query: ", req.query);

    if (!code) console.error("No callback code found");
    const response = await exchangeCodeForAccessToken(code);

    res.status(200);
    return res.send(response);
}
