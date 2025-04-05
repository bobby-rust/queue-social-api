import { Page } from "../models/Page";
import { User } from "../models/User";

export default class DatabaseService {
    async getSocialAccountAccessTokenFromDB(queueSocialUserId: string): Promise<string> {
        return "";
    }

    async getPageAccessTokenFromDB(
        pageType: string,
        pageId: string,
        userId: string,
    ): Promise<string> {
        return "";
    }

    async getPagesFromDB(queueSocialUserId: string) {
        const pages = await Page.find({ users: { $in: [queueSocialUserId] } });
        console.log(pages);
        return pages;
    }
}
