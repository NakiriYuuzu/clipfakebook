import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardItem } from '../shared/types';
import './App.css';

declare global {
  interface Window {
    electronAPI: {
      getClipboardHistory: () => Promise<ClipboardItem[]>;
      copyToClipboard: (content: string) => Promise<void>;
      togglePinItem: (id: string) => Promise<void>;
      deleteItem: (id: string) => Promise<boolean>;
    };
  }
}

const App: React.FC = () => {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
    // Refresh history every second
    const interval = setInterval(loadHistory, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = history.filter(item =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理鍵盤快捷鍵
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 數字鍵 1-9 快速複製對應項目
    if (event.key >= '1' && event.key <= '9') {
      const index = parseInt(event.key) - 1;
      if (index < filteredHistory.length) {
        handleItemClick(filteredHistory[index].content);
      }
    }
  }, [filteredHistory]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const loadHistory = async () => {
    const items = await window.electronAPI.getClipboardHistory();
    setHistory(items);
  };

  const handleItemClick = async (content: string) => {
    await window.electronAPI.copyToClipboard(content);
  };

  const handleTogglePin = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await window.electronAPI.togglePinItem(id);
    await loadHistory();
  };

  const handleDeleteItem = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const success = await window.electronAPI.deleteItem(id);
    if (success) {
      await loadHistory();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小時前`;
    return `${Math.floor(diffMins / 1440)} 天前`;
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="app">
      <div className="search-container">
        <input
          type="text"
          placeholder="搜尋剪貼簿歷史..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? '沒有找到符合的項目' : '剪貼簿歷史為空'}
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <div
              key={item.id}
              className={`history-item ${item.pinned ? 'pinned' : ''}`}
              onClick={() => handleItemClick(item.content)}
            >
              <div className="item-content">
                {index < 9 && <span className="shortcut-key">{index + 1}</span>}
                {item.pinned && <span className="pin-indicator">📌</span>}
                <span className="item-text">{truncateText(item.content)}</span>
              </div>
              <div className="item-actions">
                <button
                  className={`action-btn pin-btn ${item.pinned ? 'active' : ''}`}
                  onClick={(e) => handleTogglePin(item.id, e)}
                  title={item.pinned ? '取消釘選' : '釘選'}
                >
                  📌
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  title="刪除"
                  disabled={item.pinned}
                >
                  🗑️
                </button>
              </div>
              <div className="item-time">
                {formatTime(item.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="shortcut-hint">
        <span>按 Cmd+Shift+V 開啟/關閉</span>
        <span>按 1-9 快速複製項目</span>
      </div>
    </div>
  );
};

export default App;