import ElectronStore from 'electron-store';
import { ClipboardItem, StoreSchema } from '../shared/types';
import { imageStorage } from './imageStorage';

class Store {
  private store: ElectronStore<StoreSchema>;
  private maxHistorySize = 50;

  constructor() {
    this.store = new ElectronStore<StoreSchema>({
      defaults: {
        clipboardHistory: [],
        maxHistorySize: 50,
        showInDock: false
      }
    });
  }

  addClipboardItem(item: ClipboardItem) {
    const history = this.getClipboardHistory();
    
    // Remove duplicate if exists (but keep pinned items)
    const filteredHistory = history.filter(h => {
      if (item.type === 'image' && h.type === 'image') {
        // For images, we don't check for duplicates since each copy creates a new file
        return true;
      } else {
        // For text, remove duplicates
        return h.content !== item.content;
      }
    });
    
    // Add new item at the beginning
    filteredHistory.unshift(item);
    
    // Separate pinned and unpinned items
    const pinnedItems = filteredHistory.filter(h => h.pinned);
    const unpinnedItems = filteredHistory.filter(h => !h.pinned);
    
    // Keep only the latest maxHistorySize unpinned items
    const trimmedUnpinned = unpinnedItems.slice(0, this.maxHistorySize - pinnedItems.length);
    
    // Delete image files for items that will be removed
    const itemsToRemove = unpinnedItems.slice(this.maxHistorySize - pinnedItems.length);
    itemsToRemove.forEach(async (removedItem) => {
      if (removedItem.type === 'image' && removedItem.imagePath) {
        await imageStorage.deleteImage(removedItem.imagePath);
      }
    });
    
    // Combine pinned items (at the top) with unpinned items
    const finalHistory = [...pinnedItems, ...trimmedUnpinned];
    
    this.store.set('clipboardHistory', finalHistory);
  }

  getClipboardHistory(): ClipboardItem[] {
    const history = this.store.get('clipboardHistory', []);
    // Sort to ensure pinned items always appear at the top
    return history.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }

  togglePinItem(id: string) {
    const history = this.getClipboardHistory();
    const updatedHistory = history.map(item => 
      item.id === id ? { ...item, pinned: !item.pinned } : item
    );
    this.store.set('clipboardHistory', updatedHistory);
  }

  async deleteItem(id: string): Promise<boolean> {
    const history = this.getClipboardHistory();
    const item = history.find(h => h.id === id);
    
    // Don't delete pinned items
    if (item?.pinned) {
      return false;
    }
    
    // Delete image file if it's an image item
    if (item?.type === 'image' && item.imagePath) {
      await imageStorage.deleteImage(item.imagePath);
    }
    
    const updatedHistory = history.filter(h => h.id !== id);
    this.store.set('clipboardHistory', updatedHistory);
    return true;
  }

  async clearHistory() {
    const history = this.getClipboardHistory();
    
    // Delete image files for non-pinned items
    const itemsToDelete = history.filter(h => !h.pinned);
    for (const item of itemsToDelete) {
      if (item.type === 'image' && item.imagePath) {
        await imageStorage.deleteImage(item.imagePath);
      }
    }
    
    // Only keep pinned items when clearing
    const pinnedItems = history.filter(h => h.pinned);
    this.store.set('clipboardHistory', pinnedItems);
  }

  setMaxHistorySize(size: number) {
    this.maxHistorySize = size;
    this.store.set('maxHistorySize', size);
  }

  getShowInDock(): boolean {
    return this.store.get('showInDock', false);
  }

  setShowInDock(show: boolean) {
    this.store.set('showInDock', show);
  }
}

export default Store;