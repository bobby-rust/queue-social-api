import { config } from "../config/dotenv";
import s3 from "../config/s3";
import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

export default class AWSService {
    async upload(
        fileBuffer: Buffer,
        fileName: string,
        mimeType: string,
    ): Promise<string> {
        const params: PutObjectCommandInput = {
            Bucket: config.AWS_BUCKET,
            Key: `images/${Date.now()}_${fileName}`,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: "public-read",
        };

        try {
            const command = new PutObjectCommand(params);
            await s3.send(command);
            return `https://${config.AWS_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${params.Key}`;
        } catch (e) {
            console.error("Error uploading to S3: ", e);
            return "Error";
        }
    }
}
