export type FacebookPageResponse = {
    id: string;
    name: string;
    picture: {
        data: FBPagePictureData;
    };
};

export interface FBPagePictureData {
    width: number;
    height: number;
    url: string;
    is_silhouette: boolean;
}

export interface FBPageInfo {
    access_token: string;
    category: string;
    category_list: any[];
    name: string;
    id: string;
    tasks: string[];
}

export type FacebookLoginResponse =
    | {
        userAccessToken: string;
        pages: FacebookPageResponse[];
    }
    | { error: string };

export interface Post {
    pageId: string;
    text: string;
    imageUrl?: string;
    scheduledPublishTime: string;
}
