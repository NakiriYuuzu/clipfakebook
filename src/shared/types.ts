export interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  pinned?: boolean;
}

export interface StoreSchema {
  clipboardHistory: ClipboardItem[];
  maxHistorySize: number;
  showInDock: boolean;
}