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
    });

    this.bucketName = 'documents'; // Supabase storage bucket name
  }

  async uploadFile(fileBuffer, fileName, mimeType, businessId) {
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
      console.error('Error uploading to Supabase Storage:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
