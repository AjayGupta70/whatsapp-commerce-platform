import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.bucketName = this.configService.get<string>('storage.bucketName', 'whatsapp-media');
    this.publicUrl = this.configService.get<string>('storage.publicUrl', 'http://127.0.0.1:9000');
    
    let endpoint = this.configService.get<string>('storage.endpoint', '127.0.0.1');
    const port = this.configService.get<number>('storage.port', 9000);
    const useSSL = this.configService.get<boolean>('storage.useSSL', false);
    
    // Auto-detect if we are using local Minio vs AWS S3 based on endpoint format
    const isMinio = !endpoint.includes('amazonaws.com');
    const fullEndpoint = isMinio ? `http${useSSL ? 's' : ''}://${endpoint}:${port}` : `https://${endpoint}`;

    this.s3Client = new S3Client({
      endpoint: fullEndpoint,
      region: isMinio ? 'us-east-1' : this.configService.get<string>('storage.region', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('storage.accessKey', 'minioadmin'),
        secretAccessKey: this.configService.get<string>('storage.secretKey', 'minioadmin'),
      },
      forcePathStyle: isMinio, // Required for Minio
    });

    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`Bucket ${this.bucketName} already exists.`);
    } catch (error) {
      if (error.name === 'NotFound') {
        this.logger.log(`Creating bucket ${this.bucketName}...`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        
        // Set Public Read Policy
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucketName,
            Policy: JSON.stringify(policy),
          })
        );
        this.logger.log(`Bucket ${this.bucketName} created and made public.`);
      } else {
        this.logger.error(`Error checking bucket: ${error.message}`);
      }
    }
  }

  /**
   * Saves buffer to MinIO / S3.
   */
  async uploadFile(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    const fileExtension = path.extname(originalFilename) || '.jpg';
    const uniqueFilename = `${uuidv4()}${fileExtension}`;

    // Basic MIME type detection
    let contentType = 'application/octet-stream';
    if (fileExtension === '.png') contentType = 'image/png';
    if (fileExtension === '.jpg' || fileExtension === '.jpeg') contentType = 'image/jpeg';
    if (fileExtension === '.pdf') contentType = 'application/pdf';

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFilename,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    const isMinio = !this.configService.get<string>('storage.endpoint', '127.0.0.1').includes('amazonaws.com');
    // If MinIO, path style: URL/bucketName/key
    const fileUrl = isMinio 
        ? `${this.publicUrl}/${this.bucketName}/${uniqueFilename}`
        : `https://${this.bucketName}.s3.amazonaws.com/${uniqueFilename}`;

    this.logger.log(`Saved file to MinIO/S3: ${fileUrl}`);
    return fileUrl;
  }
}
