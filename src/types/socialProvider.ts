import { Post } from "./index";

/**
 * An account has one or more pages
 * We link an account are are granted access
 * to one or more of these pages
 */
export interface SocialProvider {
    // The URL for the Social Media API
    apiUrl: string;

    /**
     * Gain access to a social media account and its page(s)
     * An access token is saved in the database and is associated
     * with the user
     */
    linkAccount(queueSocialUserId: string, redirect: (url: string) => void): void;

    // Gets a page's profile picture from the social media's API
    getPagePicture(pageId: string, pageAccessToken: string): Promise<string>;

    // The post contains the pageId
    createPost(post: Post, pageAccessToken: string): void;
    createPostWithImage(post: Post, pageAccessToken: string): void;

    getUserId(socialAccountAccessToken: string): Promise<string>;
    getPagesFromSocialAPI(
        socialAccountUserId: string,
        socialAccountAccessToken: string,
    ): Promise<any[]>;
}
