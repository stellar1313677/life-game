# 鐵匠鋪開發日誌（第零天）

> 日期：2026-08-06（週四）
> 配合 `sdd.md`
> 環境：Windows 11

後續 [`day1log.md`](./day1log.md) 起改配合 `sdd-v2.md`。

---

## 0 · 今日成果一覽

| 階段 | 任務 | 狀態 |
|---|---|---|
| 1 | GitHub repo scaffold | ✅ |
| 2 | P0：心情日誌 / 捕捉層 / 定義層 | ✅ |
| 3 | P0：史詩神器（節點進度 + 一次性 roll）| ✅ |
| 4 | P1：傳承武器（累積鍛造）/ 展覽牆殘缺度 SVG | ✅ |
| 5 | 額外：任務日誌 / Spotify deep link | ✅ |
| 6 | 修正心情狀態重置時間 bug（UTC → 本地時間）| ✅ |

---

## 1 · repo scaffold + P0/P1 實作

### 建立專案骨架

```
index.html
src/css/style.css
src/js/
assets/
docs/sdd.md
README.md
LICENSE
.gitignore
```

打包成 zip、`git init` 好，終端機指令：

```bash
git add -A
git commit -m "Initial scaffold: life-game project structure"
git branch -M main
git remote add origin https://github.com/<username>/life-game.git
git push -u origin main
```

**踩雷**：第一次 commit 時遇到 git identity 錯誤（沒設 `user.name`/`user.email`）。給了 `git config` 指令 + 修正過的 `git add -A` 流程解決。

### 實作 P0 + P1（對照 SDD 第 9 節優先順序表）

| 對照 SDD | 實作內容 |
|---|---|
| P0 · 心情日誌（第 2.1 節）| 五種心情狀態，透過 CSS custom properties 驅動頁面氛圍光暈 |
| P0 · 捕捉層（第 2.2 節）| 零摩擦快速輸入（礦堆）|
| P0 · 定義層（第 2.3 節）| 支援兩種神器類型的設定 modal |
| P0 · 史詩神器（第 3.1 節）| 節點進度 + 完成時一次性 roll 詞條 |
| P1 · 傳承武器（第 3.2 節）| 累積鍛造次數 + 達門檻觸發強化 roll |
| P1 · 展覽牆殘缺度（第 5.1 節）| 程序化 SVG 呈現，不需使用者上傳圖片 |
| （額外）任務日誌（第 7 節）| 自由文字欄位 |
| （額外）音樂 deep link（第 6 節）| Spotify 深層連結 |

**原則落實**（對照第 8 節）：全程不出現「你已經 X 天沒做」這類提示；心情狀態直接控制任務呈現密度；SVG 殘缺度視覺全自動計算，不強迫使用者處理圖片。

**驗證**：稀有度機率曲線與傳承武器成長曲線各跑 40,000 次模擬驗證分佈符合設計。

**資料層**：`localStorage`，key `lifegame.forge.v1`，無後端。

---

## 2 · 心情狀態重置時間 bug

**現象**：使用者問「心情狀態什麼時候重置」時發現不對勁——照 UTC 算，本地時間早上 8 點才重置，不是預期的午夜。

**原因**：UTC 時區 bug，重置邏輯沒轉本地時間。

**修法**：改用本地時間，並加一個可調整的日界線常數 `DAY_START_HOUR`（`state.js`，預設 4 點），支援熬夜工作場景不會在半夜被強制跨日。

**檔案異動**：`state.js`
