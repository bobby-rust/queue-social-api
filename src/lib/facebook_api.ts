import { config } from "../config/dotenv";
import { fetchJSON } from "./utils";

/**
 * Returns a long-lived user access token (expires in ~60 days)
 */
export async function exchangeCodeForAccessToken(
    code: string,
): Promise<string | Object> {
    const url =
        config.FACEBOOK_API_URL +
        "/oauth/access_token?" +
        `client_id=${config.FACEBOOK_APP_ID}` +
        `&redirect_uri=${config.REDIRECT_URI}` +
        `&client_secret=${config.FACEBOOK_APP_SECRET}` +
        `&code=${code}`;

    const response = await fetchJSON(url);
    console.log("access token response: ", response);

    return response;
}

export async function getFacebookPages(userId: string, userAccessToken: string);
