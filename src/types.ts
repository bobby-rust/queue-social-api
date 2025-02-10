export type FacebookPageResponse = {
    id: string;
    name: string;
    picture: {
        data: {
            width: number;
            height: number;
            url: string;
            is_silhouette: boolean;
        };
    };
};

export type FacebookLoginResponse =
    | {
        userAccessToken: string;
        pages: FacebookPageResponse[];
    }
    | { error: string };
