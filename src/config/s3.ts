import { config } from "./dotenv";
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_KEY,
        secretAccessKey: config.AWS_SECRET,
    },
});

export default s3;
