import { contextBridge, ipcRenderer } from 'electron';
import { ClipboardItem } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getClipboardHistory: (): Promise<ClipboardItem[]> => {
    return ipcRenderer.invoke('get-clipboard-history');
  },
  copyToClipboard: (content: string): Promise<void> => {
    return ipcRenderer.invoke('copy-to-clipboard', content);
  },
  togglePinItem: (id: string): Promise<void> => {
    return ipcRenderer.invoke('toggle-pin-item', id);
  },
  deleteItem: (id: string): Promise<boolean> => {
    return ipcRenderer.invoke('delete-item', id);
  },
  getDockSetting: (): Promise<boolean> => {
    return ipcRenderer.invoke('get-dock-setting');
  },
  setDockSetting: (show: boolean): Promise<void> => {
    return ipcRenderer.invoke('set-dock-setting', show);
  }
});