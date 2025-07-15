import { clipboard } from 'electron';
import { ClipboardItem } from '../shared/types';
import Store from './store';

export class ClipboardManager {
  private lastContent: string = '';
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

  private checkClipboard() {
    const currentContent = clipboard.readText();
    
    // Only add if content changed and not empty
    if (currentContent && currentContent !== this.lastContent) {
      this.lastContent = currentContent;
      this.addToHistory(currentContent);
    }
  }

  private addToHistory(content: string) {
    const item: ClipboardItem = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: Date.now(),
      type: 'text'
    };

    this.store.addClipboardItem(item);
  }

  getHistory(): ClipboardItem[] {
    return this.store.getClipboardHistory();
  }

  copyToClipboard(content: string) {
    clipboard.writeText(content);
    this.lastContent = content;
  }
}