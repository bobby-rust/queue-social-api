import { config } from "../config/dotenv";
import { fetchJSON } from "./utils";

/**
 * Returns a long-lived user access token (expires in ~60 days)
 */
export async function exchangeCodeForAccessToken(code: string): Promise<any> {
    const url =
        config.FACEBOOK_API_URL +
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
 */
export async function getFacebookPages(loginCode: string) {
    const userAccessToken = await exchangeCodeForAccessToken(loginCode);
    const userId = await getUserId(userAccessToken);
    const url =
        config.FACEBOOK_API_URL +
        `/${userId}/accounts` +
        `?access_token=${userAccessToken}`;

    const pagesData = await fetchJSON(url);
    return pagesData.data || [];
}

/**
 * Gets a facebook page's profile picture
 */
export async function getFacebookPagePicture(
    pageId: string,
    pageAccessToken: string,
) {
    const url =
        config.FACEBOOK_API_URL +
        `/${pageId}?access_token=${pageAccessToken}&fields=picture`;

    const response = await fetchJSON(url);
    return response.picture.data;
}

/**
 * Gets an app access token
 * App access tokens are sensitive and must never be exposed client side
 */
export async function getAppAccessToken(): Promise<string> {
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
export async function inspectAccessToken(accessToken: string): Promise<any> {
    const appAccessToken = await getAppAccessToken();
    const url =
        config.FACEBOOK_API_URL +
        "/debug_token" +
        `?input_token=${accessToken}` +
        `&access_token=${appAccessToken}`;

    const response = await fetchJSON(url);
    return response.data;
}

/**
 * Gets the user ID associated with the access token
 */
export async function getUserId(accessToken: string): Promise<string> {
    const accessTokenInspection = await inspectAccessToken(accessToken);
    return accessTokenInspection.user_id;
}

/**
 * Creates a new facebook post for a page that publishes at scheduled_publish_time
 * @param scheduled_publish_time Must be between 30 minutes and 30 days from the time of the request
 * The scheduled publish time must be an integer UNIX timestamp [in seconds],
 * an ISO 8061 timestamp string, or any string parsable by PHP's strtotime()
 */
export async function createPost(
    pageId: string,
    message: string,
    scheduled_publish_time: string,
) {
    const url = config.FACEBOOK_API_URL + `/${pageId}/feed`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: message,
            published: false,
            scheduled_publish_time: scheduled_publish_time,
        }),
    });
}
