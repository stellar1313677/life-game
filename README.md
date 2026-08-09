# life-game 🔨 鐵匠鋪

一個以「鐵匠鋪」為主題的習慣養成與任務管理網頁遊戲。你是鐵匠，任務是原礦，完成任務是鍛造，展覽牆是你多年打造下來的收藏室。

不是生產力工具，是一個讓「今天有沒有打開這個網頁」比「完成了多少任務」更重要的系統。

## 🔗 線上連結

部署後將可透過 GitHub Pages 開啟：
`https://<你的GitHub帳號>.github.io/life-game/`

（尚未部署，見下方「開發與部署」）

## 📖 設計文件

完整系統設計文件（SDD）在 [`docs/sdd-v2.md`](./docs/sdd-v2.md)（v1 保留於 [`docs/sdd.md`](./docs/sdd.md) 作為歷史紀錄），涵蓋：

- 世界觀分支（現代／仙俠／魔法）與開場故事
- 心情簽到如何驅動當日任務密度、牆面氛圍、動物出沒
- 捕捉層 / 定義層的兩段式任務建立流程
- 史詩神器（一次性任務）與傳承武器（習慣任務）兩種鍛造邏輯
- 詞條、品質顏色與奇物彩蛋系統
- 展覽牆的殘缺度視覺呈現方式、背景動物景深系統
- 回爐 / 靜置機制與貫穿全系統的措辭規範

## 🚧 開發狀態

已依 SDD v2 §15.2 完成 **MVP 範圍**：

| 模組 | 狀態 |
|---|---|
| 分支 | 現代／科技（其餘兩分支的開場故事與 skin 資料已預先寫入 `data.js`，UI 標示「即將開放」） |
| Skin | 3 種可抽（霰彈槍／步槍／動力刀），其餘 7 種列於資料表待開放 |
| 心情簽到 | 完整 5 種 mood + 密度／色溫映射 |
| 捕捉層 / 定義層 | 完整，含安全區規則、難度滑桿、EPIC 節點編輯 |
| 詞條庫 | 完整 50 個形容詞 + 7 個奇物彩蛋 |
| EPIC / LEGACY | 完整，含品質計算、鍛造完成儀式（4 階段動畫）、次數門檻強化 |
| 回爐 / 靜置 | 完整 |
| 背景動物 | SDD 原始 10 種已實作（景深、透明度、安靜組、輸入專注模式、2 幀走路/游動剪影），另加一種真實圖片素材的狗（`animal_pictures/dog/`，4 幀跑步循環）。預設啟用 4 種，其餘可於設定頁自行開啟 |
| Spotify | 深層連結 + 依心情對應歌單設定 |

尚未實作（見 SDD §15.3 後續擴充順序）：第二 / 第三分支的完整素材、跨裝置資料同步。

所有資料存於瀏覽器 `localStorage`（key: `forge_state_v2`），換裝置或清除快取會遺失鍛造紀錄。

## 🗂 專案結構

```
life-game/
├── index.html            # 入口頁面 / 全部畫面骨架
├── src/
│   ├── css/
│   │   └── style.css     # 鍛造主題樣式、心情色溫、鍛造儀式動畫
│   └── js/
│       ├── data.js       # 詞條庫、skin、動物、品質色、難度表、開場故事（靜態資料）
│       ├── state.js      # localStorage 存取、資料模型、任務 CRUD
│       ├── rolls.js      # tier 抽選、品質計算、EPIC/LEGACY 鍛造邏輯
│       ├── animals.js    # 背景動物排程
│       ├── render.js     # 展覽牆 / 卡片 / 捕捉層列表渲染
│       ├── ceremony.js   # 鍛造完成儀式（4 階段時序動畫）
│       ├── ui.js         # 彈窗、表單、事件綁定、設定、日誌回顧
│       └── main.js       # 啟動流程（分支選擇 → 心情簽到 → 主畫面）
├── assets/
│   ├── artifacts/        # 神器/武器完成圖（使用者上傳，選用）
│   └── audio/            # 音效（鍛造敲擊音等，尚未提供素材）
├── animal_pictures/
│   └── dog/               # 狗的 4 幀跑步循環真實圖片（背景動物用，見 data.js DOG 條目）
├── docs/
│   ├── sdd-v2.md            # 目前開發依據的設計文件
│   ├── sdd.md                # v1 歷史紀錄
│   ├── appearancebug.md      # 外觀/渲染類 bug 紀錄
│   ├── animalsbug.md         # 背景動物系統專屬 bug 紀錄
│   ├── day1log.md            # 開發日誌（第一天）
│   └── day2log.md            # 開發日誌（第二天）
└── README.md
```

## 🌐 開發與部署（GitHub Pages）

這是純前端專案（HTML/CSS/JS，無建置流程、無外部套件），可直接用 GitHub Pages host：

1. 到 repo 的 **Settings → Pages**
2. Source 選擇 `Deploy from a branch`
3. Branch 選擇 `main`，資料夾選 `/ (root)`
4. 儲存後，幾分鐘內會產生連結 `https://<帳號>.github.io/life-game/`

本機開發只需要用瀏覽器直接打開 `index.html`（所有腳本皆為傳統 `<script>` 而非 ES module，因此不需要本地伺服器也能執行），或用簡單的 local server（例如 VS Code Live Server 擴充功能）。

## 📄 授權

MIT License，詳見 [`LICENSE`](./LICENSE)。
