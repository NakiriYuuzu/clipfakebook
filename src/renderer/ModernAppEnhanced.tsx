import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  Settings, 
  Pin, 
  Trash2, 
  Image as ImageIcon, 
  FileText,
  Sun,
  Moon,
  Monitor,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { ClipboardItem } from '../shared/types';
import { formatTime, formatFileSize, truncateText } from '../shared/utils';
import { SafeImage } from '../shared/components/SafeImage';
import '../shared/electronAPI';
import './ModernApp.css';

// 主題類型
type Theme = 'light' | 'dark' | 'system';

// 設定類型
interface AppSettings {
  theme: Theme;
  showInDock: boolean;
}

// 主題圖標組件
const ThemeIcon: React.FC<{ theme: Theme; size?: number }> = ({ theme, size = 16 }) => {
  switch (theme) {
    case 'light':
      return <Sun size={size} />;
    case 'dark':
      return <Moon size={size} />;
    case 'system':
      return <Monitor size={size} />;
    default:
      return <Monitor size={size} />;
  }
};

// 現代化安全圖片組件 (使用共享組件)
const ModernSafeImage: React.FC<{
  imagePath: string;
  alt: string;
  className?: string;
}> = ({ imagePath, alt, className = '' }) => {
  return (
    <SafeImage 
      imagePath={imagePath} 
      alt={alt} 
      className={`modern-image-preview ${className}`}
      loadingText=""
      errorText=""
    />
  );
};

// 載入指示器組件
const LoadingIndicator: React.FC = () => (
  <div className="loading-container">
    <Loader2 size={32} className="animate-spin" />
    <p>載入中...</p>
  </div>
);

// 空狀態組件
const EmptyState: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <div className="modern-empty-state">
    <ClipboardList size={48} />
    <div className="modern-empty-title">
      {searchTerm ? '沒有找到符合的項目' : '剪貼簿歷史為空'}
    </div>
    <div className="modern-empty-subtitle">
      {searchTerm ? '試試其他搜尋條件' : '開始複製內容以查看歷史記錄'}
    </div>
  </div>
);


// 現代化歷史項目組件 (保留供向後兼容)
const ModernHistoryItem: React.FC<{
  item: ClipboardItem;
  index: number;
  onItemClick: (item: ClipboardItem) => void;
  onTogglePin: (id: string, event: React.MouseEvent) => void;
  onDeleteItem: (id: string, event: React.MouseEvent) => void;
}> = ({ item, index, onItemClick, onTogglePin, onDeleteItem }) => {

  return (
    <div
      className={`modern-history-item ${item.pinned ? 'pinned' : ''} ${item.type === 'image' ? 'image-item' : 'text-item'}`}
      onClick={() => onItemClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(item);
        }
      }}
    >
      {/* 左側內容區域 */}
      <div className="modern-item-left">
        {/* 快捷鍵 */}
        {index < 9 && (
          <div className="modern-shortcut-key">
            {index + 1}
          </div>
        )}

        {/* 釘選指示器 */}
        {item.pinned && (
          <div className="modern-pin-indicator">
            <Pin size={16} />
          </div>
        )}

        {/* 項目內容 */}
        <div className="modern-item-content">
          {item.type === 'image' && item.imagePath ? (
            <div className="modern-image-item">
              <ModernSafeImage
                imagePath={item.imagePath}
                alt="剪貼簿圖片"
                className="modern-image-preview"
              />
              <div className="modern-image-info">
                <div className="modern-item-text">
                  <ImageIcon size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  圖片 ({item.imageFormat?.toUpperCase()})
                </div>
                <div className="modern-image-details">
                  <span className="modern-image-type">
                    {item.imageFormat?.toUpperCase()}
                  </span>
                  <span className="modern-image-size">
                    {item.imageSize?.width}×{item.imageSize?.height}
                  </span>
                  <span className="modern-file-size">
                    {formatFileSize(item.fileSize || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="modern-item-text">
              <FileText size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {truncateText(item.content)}
            </div>
          )}
        </div>
      </div>

      {/* 右側時間和操作區域 */}
      <div className="modern-item-right">
        {/* 項目時間 */}
        <div className="modern-item-time">
          {formatTime(item.timestamp)}
        </div>

        {/* 項目操作 */}
        <div className="modern-item-actions">
          <button
            className={`modern-action-btn modern-pin-btn ${item.pinned ? 'active' : ''}`}
            onClick={(e) => onTogglePin(item.id, e)}
            title={item.pinned ? '取消釘選' : '釘選'}
            aria-label={item.pinned ? '取消釘選' : '釘選'}
          >
            <Pin size={18} />
          </button>
          <button
            className="modern-action-btn modern-delete-btn"
            onClick={(e) => onDeleteItem(item.id, e)}
            title="刪除"
            aria-label="刪除"
            disabled={item.pinned}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 主要應用組件
const ModernAppEnhanced: React.FC = () => {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    showInDock: false
  });

  // 載入設定
  const loadSettings = useCallback(async () => {
    try {
      const showInDock = await window.electronAPI.getDockSetting();
      const savedTheme = localStorage.getItem('app-theme') as Theme || 'system';
      
      setSettings({
        theme: savedTheme,
        showInDock
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // 應用主題
  const applyTheme = useCallback((theme: Theme) => {
    let effectiveTheme = theme;
    
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, []);

  // 更新設定
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (newSettings.theme) {
      localStorage.setItem('app-theme', newSettings.theme);
      applyTheme(newSettings.theme);
    }
    
    if (newSettings.showInDock !== undefined) {
      try {
        await window.electronAPI.setDockSetting(newSettings.showInDock);
      } catch (error) {
        console.error('Error updating dock setting:', error);
      }
    }
  }, [settings, applyTheme]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme, applyTheme]);

  useEffect(() => {
    loadHistory();
    
    // 每秒刷新歷史記錄
    const interval = setInterval(loadHistory, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    if (item.type === 'image') {
      return 'image'.includes(searchLower) || 
             (item.imageFormat?.toLowerCase().includes(searchLower) ?? false);
    }
    return item.content.toLowerCase().includes(searchLower);
  });

  // 鍵盤快捷鍵
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 數字鍵 1-9 快速複製
    if (event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const index = parseInt(event.key) - 1;
      if (index < filteredHistory.length) {
        handleItemClick(filteredHistory[index]);
      }
    }
    
    // Escape 關閉設定
    if (event.key === 'Escape' && showSettings) {
      setShowSettings(false);
    }
  }, [filteredHistory, showSettings]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 監聽系統主題變化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [settings.theme, applyTheme]);

  const loadHistory = async () => {
    try {
      const items = await window.electronAPI.getClipboardHistory();
      setHistory(items);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = async (item: ClipboardItem) => {
    try {
      await window.electronAPI.copyToClipboard(item);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleTogglePin = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await window.electronAPI.togglePinItem(id);
      await loadHistory();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDeleteItem = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const success = await window.electronAPI.deleteItem(id);
      if (success) {
        await loadHistory();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="modern-app">
      {/* 現代化頭部 */}
      <header className="modern-header">
        <div className="modern-search-container">
          <div className="modern-search-icon">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="搜尋剪貼簿內容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-search-input"
            aria-label="搜尋剪貼簿內容"
          />
        </div>
        <button
          className="modern-settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="設定"
          aria-label="開啟設定"
          aria-expanded={showSettings}
        >
          <Settings size={20} />
        </button>
      </header>

      {/* 現代化設定面板 */}
      {showSettings && (
        <div className="modern-settings-panel">
          <div className="modern-setting-item">
            <label className="modern-setting-label">
              主題設定
            </label>
            <div className="modern-theme-selector">
              {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
                <button
                  key={theme}
                  className={`modern-theme-btn ${settings.theme === theme ? 'active' : ''}`}
                  onClick={() => updateSettings({ theme })}
                  title={theme === 'light' ? '淺色主題' : theme === 'dark' ? '深色主題' : '跟隨系統'}
                >
                  <ThemeIcon theme={theme} size={18} />
                  <span>
                    {theme === 'light' ? '淺色' : theme === 'dark' ? '深色' : '系統'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
        </div>
      )}

      {/* 現代化歷史列表 */}
      <main className="modern-history-list">
        {isLoading ? (
          <LoadingIndicator />
        ) : filteredHistory.length === 0 ? (
          <EmptyState searchTerm={searchTerm} />
        ) : (
          <>
            {/* 統一時間序列列表 */}
            {filteredHistory.map((item, index) => (
              <ModernHistoryItem
                key={item.id}
                item={item}
                index={index}
                onItemClick={handleItemClick}
                onTogglePin={handleTogglePin}
                onDeleteItem={handleDeleteItem}
              />
            ))}
          </>
        )}
      </main>

      {/* 現代化底部 */}
      <footer className="modern-footer">
        <div className="modern-footer-left">
          <div className="modern-stats">
            <span className="modern-stats-text">
              共 {filteredHistory.length} 筆項目
              {searchTerm && ` (搜尋結果)`}
            </span>
          </div>
        </div>
        <div className="modern-footer-right">
          <div className="modern-shortcut-hint">
            <div className="modern-shortcut-combo">
              <span>⌘</span>
              <span>⇧</span>
              <span>V</span>
            </div>
            <span>開啟/關閉</span>
          </div>
          <div className="modern-shortcut-hint">
            <div className="modern-shortcut-combo">
              <span>1-9</span>
            </div>
            <span>快速複製</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernAppEnhanced;