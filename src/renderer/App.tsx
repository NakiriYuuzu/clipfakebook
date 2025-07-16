import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardItem } from '../shared/types';
import { formatTime, formatFileSize, truncateText } from '../shared/utils';
import { SafeImage } from '../shared/components/SafeImage';
import '../shared/electronAPI';
import './App.css';


const App: React.FC = () => {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInDock, setShowInDock] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadHistory();
    loadDockSetting();
    // Refresh history every second
    const interval = setInterval(loadHistory, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = history.filter(item => {
    if (item.type === 'image') {
      // For images, search in the display text and format
      return 'image'.includes(searchTerm.toLowerCase()) || 
             (item.imageFormat?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    }
    return item.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 處理鍵盤快捷鍵
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 數字鍵 1-9 快速複製對應項目
    if (event.key >= '1' && event.key <= '9') {
      const index = parseInt(event.key) - 1;
      if (index < filteredHistory.length) {
        handleItemClick(filteredHistory[index]);
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

  const loadDockSetting = async () => {
    const setting = await window.electronAPI.getDockSetting();
    setShowInDock(setting);
  };

  const handleItemClick = async (item: ClipboardItem) => {
    await window.electronAPI.copyToClipboard(item);
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


  const handleDockSettingChange = async (show: boolean) => {
    await window.electronAPI.setDockSetting(show);
    setShowInDock(show);
  };

  return (
    <div className="app">
      <div className="header">
        <div className="search-container">
          <input
            type="text"
            placeholder="搜尋剪貼簿歷史..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="設定"
        >
          ⚙️
        </button>
      </div>
      
      {showSettings && (
        <div className="settings-panel">
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={showInDock}
                onChange={(e) => handleDockSettingChange(e.target.checked)}
                className="setting-checkbox"
              />
              在 Dock 中顯示圖示
            </label>
          </div>
        </div>
      )}
      
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
              onClick={() => handleItemClick(item)}
            >
              <div className="item-content">
                {index < 9 && <span className="shortcut-key">{index + 1}</span>}
                {item.pinned && <span className="pin-indicator">📌</span>}
                {item.type === 'image' && item.imagePath ? (
                  <div className="image-item">
                    <SafeImage 
                      imagePath={item.imagePath} 
                      alt="Clipboard image" 
                      className="image-preview"
                    />
                    <div className="image-info">
                      <span className="image-type">{item.imageFormat?.toUpperCase()}</span>
                      <span className="image-size">{item.imageSize?.width}×{item.imageSize?.height}</span>
                      <span className="file-size">{formatFileSize(item.fileSize || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <span className="item-text">{truncateText(item.content)}</span>
                )}
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
        <span>按 CMD+[1-9] 快速複製項目</span>
      </div>
    </div>
  );
};

export default App;