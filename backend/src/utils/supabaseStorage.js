const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

class SupabaseStorage {
  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.SUPABASE_STORAGE_ENDPOINT,
      region: process.env.SUPABASE_REGION,
      credentials: {
        accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID,
        secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
      // Add SSL configuration to handle connection issues
      requestHandler: {
        httpsAgent: {
          rejectUnauthorized: true,
          keepAlive: true,
          timeout: 30000,
        }
      },
      // Add retry configuration
      retryMode: 'adaptive',
      maxAttempts: 3,
    });

    this.bucketName = 'eKahera'; // Supabase storage bucket name
  }

  async uploadFile(fileBuffer, fileName, mimeType, businessId, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const key = `business_${businessId}/${Date.now()}_${fileName}`;

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          ACL: 'public-read'
        });

        const result = await this.s3.send(command);

        return {
          success: true,
          url: `${process.env.SUPABASE_STORAGE_ENDPOINT}/${this.bucketName}/${key}`,
          key: key
        };
      } catch (error) {
        lastError = error;
        console.error(`Supabase upload attempt ${attempt}/${maxRetries} failed:`, error.message);

        // If it's the last attempt, don't retry
        if (attempt === maxRetries) break;

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error('All Supabase upload attempts failed:', lastError);
    return {
      success: false,
      error: lastError.message
    };
  }

  async downloadFile(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const result = await this.s3.send(command);

      return {
        success: true,
        buffer: result.Body,
        contentType: result.ContentType
      };
    } catch (error) {
      console.error('Error downloading from Supabase Storage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3.send(command);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting from Supabase Storage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getPublicUrl(key) {
    return `${process.env.SUPABASE_STORAGE_ENDPOINT}/${this.bucketName}/${key}`;
  }
}

module.exports = new SupabaseStorage();
