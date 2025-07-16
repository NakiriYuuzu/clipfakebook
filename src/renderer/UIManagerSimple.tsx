import React, { useState, useEffect } from 'react';
import './UIManager.css';

// 動態導入組件
const ClassicApp = React.lazy(() => import('./App'));
const ModernApp = React.lazy(() => import('./ModernAppEnhanced'));

// 加載指示器組件
const LoadingIndicator: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>載入中...</p>
  </div>
);

// 錯誤邊界組件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI Manager Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <div className="error-content">
            <h2>🚨 UI 載入錯誤</h2>
            <p>應用程式遇到了問題，正在嘗試恢復...</p>
            <details>
              <summary>錯誤詳情</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
            <button onClick={() => window.location.reload()}>
              重新載入
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 簡化的UI管理器組件
const UIManagerSimple: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'classic' | 'modern'>('modern');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 讀取儲存的UI模式偏好
    const savedMode = localStorage.getItem('ui-mode') as 'classic' | 'modern' || 'modern';
    setCurrentMode(savedMode);
    
    // 短暫延遲以顯示載入動畫
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 渲染UI組件
  const renderUI = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    const UIComponent = currentMode === 'modern' ? ModernApp : ClassicApp;
    
    return (
      <React.Suspense fallback={<LoadingIndicator />}>
        <UIComponent />
      </React.Suspense>
    );
  };

  // 應用CSS類名
  const appClassName = [
    'ui-manager',
    `ui-mode-${currentMode}`,
  ].filter(Boolean).join(' ');

  return (
    <ErrorBoundary>
      <div className={appClassName}>
        {renderUI()}
      </div>
    </ErrorBoundary>
  );
};

export default UIManagerSimple;