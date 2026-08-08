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

---

## #2　只有搖擺不夠，動物移動還是很怪異——要真的有 2、3 張圖片互相切換

**狀態**：已修復（2026-08-08）

### 症狀

#1 修完後（三層結構 + 上下搖擺）使用者還是覺得動物移動很怪，明確指出希望的效果：**要有 2、3 張圖片真的互相切換**，讓動物有走路/游動的感覺，不是靠緩動搖擺硬撐。

### 根因

#1 的修法本質上還是「同一張圖片」在做連續、平滑的 `translateY` 緩動振盪 —— 不管幅度調得多剛好，看起來都是「同一個東西在抖」，不是「腳在走路」。真正的走路/游動感需要的是**離散的姿勢切換**（像老遊戲的 2 幀走路 sprite），不是連續緩動。這是我理解錯使用者原始需求的地方：「沒有走路動畫」講的就是字面意思，要換圖，不是要加緩動。

### 修法

整個動物視覺從單一 emoji 改成程序化 SVG 剪影，並且真的做 2 幀切換：

1. `data.js` 新增 `Data.ANIMAL_FRAMES`：5 種動作原型（`walk` 四足走路、`fly` 振翅、`swim` 尾鰭擺動、`crawl` 蝸牛爬行、`flicker` 螢火蟲明滅），每種各手繪 2 幀側面線稿剪影（`viewBox 0 0 100 50`，`stroke="currentColor"`）。兩幀共用身體輪廓，只有腳／翅膀／尾鰭／觸角那幾筆換位置，這樣切換起來身體不會跳動，只有該動的部位在動。`Data.ANIMALS` 每筆資料新增 `motion` 欄位指定套用哪種原型。
2. `animals.js` 新增 `makeFrameIcon()`：建立一個內含 SVG 的 icon 元素，用 `setTimeout` 遞迴排程在兩幀之間**硬切換**（直接換 `innerHTML`，不加任何 transition/fade），換幀速度跟 #1 已經算好的 `bobDur`（依動物體型調整）綁在一起 —— 大型慢速動物換幀慢、小型快速動物換幀快；螢火蟲群改用不規則亂數間隔，看起來像自然明滅而非規律機械切換。每個 icon 起始有隨機相位延遲，避免每隻動物的切換節奏同步到看起來像複製貼上。
3. 螢火蟲群從「3 個相同 emoji 排一排」改成「3 個獨立明滅、各自隨機間隔、位置微散開的光點」，比之前更接近真實螢火蟲群的樣子。
4. 動物離場（`wrapper.remove()`）時，先呼叫收集起來的全部 `stop()` 把 frame-swap 的 `setTimeout` 清掉，避免殘留的計時器繼續執行、造成記憶體外洩或幽靈更新。
5. CSS 新增 `.animal-frame`（實際的 SVG 容器）跟對應樣式；`.animal-glyph` 從單一文字容器改成可以裝 1 或 3 個 icon 的 flex 容器；`scaleX(-1)` 面向鏡射跟著移到 `.animal-frame`。

### 驗證

- CSS/JS 語法檢查、大括號平衡皆過
- 直接用 Node 呼叫 `Data.renderAnimalFrame(motion, 0)` 跟 `renderAnimalFrame(motion, 1)`，確認 5 種動作原型的兩幀內容確實不同、且都是合法的 `<svg>...</svg>`
- 完整瀏覽器 `JSDOM.fromURL` 測試在這台機器上會卡住不回應（懷疑是 http.server + jsdom 資源載入的環境問題，不是程式碼問題），改用手動 stub 一個最小 DOM／`window.setTimeout`／`State` 環境，直接跑 `Animals.init()` → 觸發 `spawnOne()`，確認：一般動物會排入「1 個換幀 timer + 1 個離場 timer」共 2 個新計時器；只啟用螢火蟲時走 swarm 分支，會排入「3 個換幀 timer + 1 個離場 timer」共 4 個，兩條路徑都沒有拋出例外
- 兩幀是否切換得夠自然、走路節奏是否對，還是需要使用者實際在瀏覽器看一次確認
