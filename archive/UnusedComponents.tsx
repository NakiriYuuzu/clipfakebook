import React from 'react';
import { Pin, Trash2, Image as ImageIcon, FileText } from 'lucide-react';
import { ClipboardItem } from '../src/shared/types';
import { formatTime, formatFileSize, truncateText } from '../src/shared/utils';

// 移除自 ModernAppEnhanced.tsx 的未使用組件
// 保留供未來可能使用

// 圖片網格組件
const ImageGrid: React.FC<{
  items: ClipboardItem[];
  onItemClick: (item: ClipboardItem) => void;
  onTogglePin: (id: string, event: React.MouseEvent) => void;
  onDeleteItem: (id: string, event: React.MouseEvent) => void;
}> = ({ items, onItemClick, onTogglePin, onDeleteItem }) => {
  // Component implementation would go here
  return null;
};

// 文字列表組件
const TextList: React.FC<{
  items: ClipboardItem[];
  offset: number;
  onItemClick: (item: ClipboardItem) => void;
  onTogglePin: (id: string, event: React.MouseEvent) => void;
  onDeleteItem: (id: string, event: React.MouseEvent) => void;
}> = ({ items, offset, onItemClick, onTogglePin, onDeleteItem }) => {
  // Component implementation would go here
  return null;
};

export { ImageGrid, TextList };