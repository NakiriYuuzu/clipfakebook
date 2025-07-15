# ClipFakeBook

一個簡單的 macOS 剪貼簿管理器，使用 Electron + TypeScript + React 開發。

## 功能特點

- 🔍 自動監控剪貼簿變化
- 📋 保存最近 50 筆剪貼簿歷史
- 🖱️ 點擊即可複製任何歷史項目
- 🔎 搜尋剪貼簿歷史
- 💾 持久化儲存（重啟應用後保留歷史）
- 🎯 常駐系統選單列（Topbar）

## 開發環境需求

- Node.js >= 14.0.
- npm >= 6.0.0
- macOS（用於測試和執行）

## 安裝與執行

```bash
# 安裝相依套件
npm install

# 開發模式執行
npm run dev

# 建置應用程式
npm run build

# 打包成 macOS 應用程式
npm run dist
```

## 使用方式

1. 啟動應用後，會在系統選單列顯示圖標
2. 點擊圖標開啟剪貼簿歷史視窗
3. 點擊任何歷史項目即可將其複製到剪貼簿
4. 使用搜尋框可以快速找到特定內容
5. 右鍵點擊圖標可以清除歷史或退出應用

## 專案結構

```
ClipFakeBook/
├── src/
│   ├── main/              # 主進程程式碼
│   │   ├── index.ts       # Electron 主進程入口
│   │   ├── clipboardManager.ts  # 剪貼簿監控管理
│   │   ├── store.ts       # 資料持久化
│   │   └── preload.ts     # 預載腳本
│   ├── renderer/          # 渲染進程程式碼
│   │   ├── App.tsx        # React 主組件
│   │   ├── App.css        # 樣式檔案
│   │   └── index.tsx      # 渲染進程入口
│   └── shared/            # 共用程式碼
│       └── types.ts       # TypeScript 型別定義
├── assets/                # 資源檔案
│   └── icon.png          # 應用圖標
├── dist/                  # 建置輸出
├── dist-app/              # 打包輸出
└── package.json           # 專案配置
```

## 技術棧

- **Electron** - 跨平台桌面應用框架
- **TypeScript** - 類型安全的 JavaScript
- **React** - UI 框架
- **electron-store** - Electron 應用資料持久化
- **Webpack** - 模組打包工具

## 授權

ISC