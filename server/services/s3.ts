import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION) {
  throw new Error("Missing required AWS credentials");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const s3Service = {
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing S3 connection...');
      console.log('Using bucket:', process.env.AWS_BUCKET_NAME);
      console.log('Using region:', process.env.AWS_REGION);

      // Test bucket access
      const headBucketCommand = new HeadBucketCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
      });

      await s3Client.send(headBucketCommand);
      console.log('Successfully connected to S3 bucket');

      return { success: true, message: 'S3 connection successful' };
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown S3 connection error' 
      };
    }
  },

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      console.log('Starting S3 upload for file:', file.originalname);
      console.log('File details:', {
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer ? 'Buffer present' : 'No buffer'
      });

      const fileExtension = file.originalname.split('.').pop();
      const randomName = crypto.randomBytes(16).toString('hex');
      const key = `product-images/${randomName}.${fileExtension}`;

      console.log('Generated S3 key:', key);

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      console.log('Sending upload command to S3...');
      await s3Client.send(command);

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      console.log('Successfully uploaded to S3, URL:', imageUrl);

      return imageUrl;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error('Failed to upload image to S3');
    }
  },

  getImageUrl(key: string): string {
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
};