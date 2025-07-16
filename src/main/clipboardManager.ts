import { clipboard, nativeImage } from 'electron';
import { ClipboardItem } from '../shared/types';
import Store from './store';
import { imageStorage } from './imageStorage';

export class ClipboardManager {
  private lastContent: string = '';
  private lastImageData: string = ''; // Store image data hash to detect changes
  private checkInterval: NodeJS.Timeout | null = null;
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  start() {
    // Check clipboard every 500ms
    this.checkInterval = setInterval(() => {
      this.checkClipboard();
    }, 500);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkClipboard() {
    // Check for image first (priority over text)
    const image = clipboard.readImage();
    
    if (!image.isEmpty()) {
      // Convert image to data URL for comparison
      const imageData = image.toDataURL();
      
      if (imageData !== this.lastImageData) {
        this.lastImageData = imageData;
        await this.addImageToHistory(image);
        return; // Don't check text if we found an image
      }
    }
    
    // Check for text
    const currentContent = clipboard.readText();
    
    // Only add if content changed and not empty
    if (currentContent && currentContent !== this.lastContent) {
      this.lastContent = currentContent;
      this.lastImageData = ''; // Clear image data when text is copied
      this.addTextToHistory(currentContent);
    }
  }

  private addTextToHistory(content: string) {
    const item: ClipboardItem = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: Date.now(),
      type: 'text'
    };

    this.store.addClipboardItem(item);
  }

  private async addImageToHistory(image: Electron.NativeImage) {
    // Save image to file
    const imageInfo = await imageStorage.saveImage(image);
    
    if (!imageInfo) {
      console.error('Failed to save image');
      return;
    }

    const item: ClipboardItem = {
      id: Date.now().toString(),
      content: 'Image', // Display text for image items
      timestamp: Date.now(),
      type: 'image',
      imagePath: imageInfo.path,
      imageSize: imageInfo.size,
      imageFormat: imageInfo.format,
      fileSize: imageInfo.fileSize
    };

    this.store.addClipboardItem(item);
  }

  getHistory(): ClipboardItem[] {
    return this.store.getClipboardHistory();
  }

  copyToClipboard(item: ClipboardItem) {
    if (item.type === 'image' && item.imagePath) {
      // Copy image to clipboard
      const image = nativeImage.createFromPath(item.imagePath);
      if (!image.isEmpty()) {
        clipboard.writeImage(image);
        this.lastImageData = image.toDataURL();
        this.lastContent = '';
      }
    } else {
      // Copy text to clipboard
      clipboard.writeText(item.content);
      this.lastContent = item.content;
      this.lastImageData = '';
    }
  }
}