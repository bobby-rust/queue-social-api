import { config } from "../config/dotenv";
import { fetchJSON } from "./utils";

export const exchangeCodeForAccessToken = async (
    code: string,
): Promise<string> => {
    const tokenURL =
        "https://graph.facebook.com/v19.0/oauth/access_token" +
        `?client_id=${config.FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}` +
        `&client_secret=${config.FACEBOOK_CLIENT_SECRET}` +
        `&code=${code}`;

    const tokenData = await fetchJSON(tokenURL);

    if (!tokenData.access_token)
        throw new Error("Failed to get short-lived token");

    return tokenData.access_token;
};

export const exchangeShortLivedTokenForLongLivedToken = async (
    shortLivedToken: string,
): Promise<string> => {
    const longLivedTokenURL =
        "https://graph.facebook.com/v19.0/oauth/access_token" +
        "?grant_type=fb_exchange_token" +
        `&client_id=${config.FACEBOOK_CLIENT_ID}` +
        `&client_secret=${config.FACEBOOK_CLIENT_SECRET}` +
        `&fb_exchange_token=${shortLivedToken}`;

    const longLivedTokenData = await fetchJSON(longLivedTokenURL);

    if (!longLivedTokenData.access_token)
        throw new Error("Failed to get long-lived user token");

    return longLivedTokenData.access_token;
};

export const getUserPages = async (accessToken: string) => {
    const pagesURL = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,picture&access_token=${accessToken}`;

    const pagesData = await fetchJSON(pagesURL);

    return pagesData.data || [];
};
