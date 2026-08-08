# 動物 Bug 紀錄

背景動物系統（`src/js/animals.js`、docs/sdd-v2.md §11）專屬的 bug 紀錄，跟一般外觀 bug（見 [`docs/appearancebug.md`](./appearancebug.md)）分開放，方便日後動物相關的問題集中查。格式同外觀 bug：症狀 → 調查方式 → 根因 → 修法 → 驗證。

---

## #1　背景動物沒有走路動畫，平移移動很怪異

**狀態**：已修復（2026-08-08）

### 症狀

使用者反映動物移動看起來不自然。

### 調查與根因

原本的實作只有一層：`.animal-wrap` 用 `linear` timing 的 `translateX` 讓動物從畫面一側滑到另一側，全程完全筆直、等速、沒有任何上下起伏 —— 對走路（狐狸、貓）、游動（錦鯉、鯨魚）、飛行（貓頭鷹、螢火蟲）這些本來就該有節奏感的動物來說，看起來就是「一個 emoji 貼著尺規平移」，這就是使用者說的「沒有走路動畫」。

另外複查了 `.animal-wrap--rtl` 舊寫法（`transform: translateX(15vw) scaleX(-1)`，同時把位移跟鏡射寫在同一個 `transform` 屬性裡），數學上重新推導後其實對「元素中心點的最終位置」沒有影響（`scaleX` 對稱於中心，不影響位移量），但這種寫法很容易在未來改動時因為兩種效果耦合在同一行而出錯，所以這次也一併拆開，不留隱患。

### 修法

改成三層結構，每層只管一件事：

```
.animal-wrap   —— 橫越畫面的長距離位移（原本就有，維持 linear）
  .animal-bob  —— 短週期上下搖擺 + 輕微傾斜，infinite 循環，模擬走路/游動節奏（新增）
    .animal-glyph —— 只管大小、透明度、面向鏡射（scaleX(-1) 移到這層，獨立於位移計算）
```

`.animal-bob` 的搖擺幅度跟週期由 JS 依動物體型動態決定（`animals.js`）：體型大、移動慢的動物（鯨魚）搖擺週期長、幅度大；體型小、移動快的動物（狐狸、貓）搖擺週期短、幅度小。每隻動物出場時額外給搖擺動畫一個隨機負的 `animation-delay`，避免所有同時在場的動物（雖然規則是最多同時 1 隻，但保留這個保險）步調完全同步、看起來像複製貼上。

`.animal-wrap--rtl` 的位移 keyframe 也順手簡化：不再用 `right:0` 覆蓋基準點，兩個方向都用同一套 `left:0` 基準，只是 `translateX` 的起訖值相反，邏輯更直觀好維護。

具體改動：

- `src/js/animals.js`：每隻動物出場時新增 `.animal-bob` 這層 DOM，依動物 `duration`／`widthPct` 算出 `--bob-dur`、`--bob-amp`、`--bob-tilt`，`scaleX(-1)` 鏡射從 wrapper 移到 `.animal-glyph`
- `src/css/style.css`：新增 `@keyframes animal-bob` 跟 `.animal-bob` 規則；`.animal-wrap--rtl` 拿掉 `right:0; left:auto`，改成跟 ltr 共用 `left:0`，只是 `animal-move-rtl` keyframe 的起訖值相反

### 驗證

- CSS/JS 語法檢查、大括號平衡皆過
- 靜態確認新的 `@keyframes animal-bob`、`.animal-bob` 規則、`.animal-wrap--rtl .animal-glyph` 規則都有正確寫入 `style.css`，舊的 `right:0` 覆蓋寫法確認已移除
- 動物出場排程本身有 8–30 秒的隨機初始延遲，非同步時間相關的視覺效果無法用 jsdom 快速斷言，這部分請使用者實際用瀏覽器看一次確認節奏是否自然
