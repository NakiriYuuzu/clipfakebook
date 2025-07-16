import { app, nativeImage, NativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

class ImageStorage {
  private imagesDir: string;
  private maxStorageSize: number = 100 * 1024 * 1024; // 100MB default
  private initialized: boolean = false;

  constructor() {
    this.imagesDir = path.join(app.getPath('userData'), 'clipboard-images');
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.imagesDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to create images directory:', error);
      throw error;
    }
  }

  async saveImage(image: NativeImage): Promise<{
    path: string;
    size: { width: number; height: number };
    format: string;
    fileSize: number;
  } | null> {
    await this.init();

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const hash = crypto.randomBytes(4).toString('hex');
      const filename = `clipboard-${timestamp}-${hash}.png`;
      const filepath = path.join(this.imagesDir, filename);

      // Get image data and info
      const size = image.getSize();
      const buffer = image.toPNG();
      
      // Save image to file
      await fs.writeFile(filepath, buffer);
      
      // Get file size
      const stats = await fs.stat(filepath);

      // Check and enforce storage limit
      await this.ensureStorageLimit();

      return {
        path: filepath,
        size: { width: size.width, height: size.height },
        format: 'png',
        fileSize: stats.size
      };
    } catch (error) {
      console.error('Failed to save image:', error);
      return null;
    }
  }

  async deleteImage(imagePath: string): Promise<void> {
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  async cleanupOldImages(keepPaths: Set<string>): Promise<void> {
    await this.init();

    try {
      const files = await fs.readdir(this.imagesDir);
      
      for (const file of files) {
        const filepath = path.join(this.imagesDir, file);
        
        if (!keepPaths.has(filepath)) {
          await this.deleteImage(filepath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old images:', error);
    }
  }

  async getStorageSize(): Promise<number> {
    await this.init();

    try {
      const files = await fs.readdir(this.imagesDir);
      let totalSize = 0;

      for (const file of files) {
        const filepath = path.join(this.imagesDir, file);
        const stats = await fs.stat(filepath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  }

  async ensureStorageLimit(): Promise<void> {
    const currentSize = await this.getStorageSize();
    
    if (currentSize > this.maxStorageSize) {
      // Get all files with their timestamps
      const files = await fs.readdir(this.imagesDir);
      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const filepath = path.join(this.imagesDir, file);
          const stats = await fs.stat(filepath);
          return { path: filepath, mtime: stats.mtime, size: stats.size };
        })
      );

      // Sort by modification time (oldest first)
      fileInfos.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      // Delete oldest files until we're under the limit
      let deletedSize = 0;
      for (const fileInfo of fileInfos) {
        if (currentSize - deletedSize <= this.maxStorageSize * 0.8) break; // Keep 80% of max
        
        await this.deleteImage(fileInfo.path);
        deletedSize += fileInfo.size;
      }
    }
  }

  getImageUrl(imagePath: string): string {
    // Convert file path to file:// URL for renderer process
    return `file://${imagePath}`;
  }
}

export const imageStorage = new ImageStorage();