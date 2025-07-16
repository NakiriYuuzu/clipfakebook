import { ClipboardItem } from './types';

/**
 * Electron API 接口聲明
 */
export interface ElectronAPI {
  getClipboardHistory: () => Promise<ClipboardItem[]>;
  copyToClipboard: (item: ClipboardItem) => Promise<void>;
  togglePinItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<boolean>;
  getDockSetting: () => Promise<boolean>;
  setDockSetting: (show: boolean) => Promise<void>;
  getImageData: (imagePath: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}