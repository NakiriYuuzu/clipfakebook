export interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  pinned?: boolean;
  // Image specific fields
  imagePath?: string; // Path to the saved image file
  imageSize?: { width: number; height: number };
  imageFormat?: string; // png, jpg, etc.
  fileSize?: number; // in bytes
}

export interface StoreSchema {
  clipboardHistory: ClipboardItem[];
  maxHistorySize: number;
  showInDock: boolean;
}