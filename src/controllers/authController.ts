import { Request, Response } from "express";
import { config } from "../config/dotenv";
import { getFacebookPagePicture, getFacebookPages } from "../lib/facebook_api";

export function login(req: Request, res: Response) {
    const fbLoginUrl =
        config.FACEBOOK_LOGIN_URL +
        "/dialog/oauth?" +
        `client_id=${config.FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
        "&scope=pages_manage_metadata,pages_manage_posts,pages_show_list,email,public_profile,pages_manage_engagement,pages_read_engagement" +
        "&response_type=code";

    return res.redirect(fbLoginUrl);
}

export async function callback(req: Request, res: Response) {
    const code = req.query.code as string;
    if (!code) console.error("No callback code found");

    const pages = await getFacebookPages(code);
    console.log(pages);

    const pageId = pages[1].id;
    const pageAccessToken = pages[1].access_token;

    const pageInfo = await getFacebookPagePicture(pageId, pageAccessToken);
    console.log("Got page info: ", pageInfo);

    return res.status(200).json(pageInfo);
}
