# Bug 紀錄

一個 bug 一則，格式：症狀 → 調查方式 → 根因 → 修法 → 驗證。修好的照樣留著，不刪，方便以後同類問題查對照。

---

## #1　心情日誌面板打開後是空的（只有標題和「關閉」）

**狀態**：已修復（2026-08-08，第二次修正才真正修好，見下方「修正紀錄」）

### 症狀

點主畫面右上角 📖「心情日誌」，面板正常彈出、標題「心情日誌」與「關閉」按鈕都在，但中間清單區塊完全空白 —— 連「還沒有紀錄。」這種零筆時該顯示的提示文字都沒有。

截圖見對話紀錄（使用者提供）：標題下方一大塊空白，直接接到關閉按鈕。

### 調查方式

沒有直接裝瀏覽器自動化工具（見 §驗證方式決策），改用 `jsdom` 在 Node 裡把 `index.html` 真的載入、把全部 `src/js/*.js` 依序執行，再用 `dispatchEvent` 模擬使用者的實際操作序列：

```
開場故事「跳過」→ 心情簽到點「平靜」→ 等待面板自動關閉 → 點「心情日誌」
```

執行後直接檢查 `#daylog-list` 的 `innerHTML`：

```
daylog-list innerHTML: "<div class=\"daylog-row\" ...>...<span class=\"daylog-row__mood\">🌾 平靜</span>...</div>"
```

**結果：邏輯正確，該有的那一列有出現。** 另外把 `dayLogs` 清空再重開面板，測「零筆」那個分支：

```
EMPTY-STATE daylog-list innerHTML: "<p class=\"wall__empty\">還沒有紀錄。</p>"
```

這條分支也正確。也就是說 `ui.js` 的 `wireDaylog()` 這段程式邏輯本身沒有問題 —— jsdom 兩種情境都能正確產生內容。

### 根因

程式邏輯沒有 bug，问题出在**瀏覽器快取**。`index.html` 原本用完全沒有版本標記的路徑載入樣式與腳本：

```html
<link rel="stylesheet" href="src/css/style.css" />
<script src="src/js/ui.js"></script>
```

這個專案是「直接雙擊本機檔案」開發（README 特別強調不需要 build），過程中 `ui.js` 被改了好幾次。瀏覽器對本機靜態檔案的快取policy 相對隨性 —— 如果測試視窗是在某次編輯**之前**就開著、之後只是重新整理，某些瀏覽器 / 預覽元件會繼續吃舊版 `ui.js`（HTML 結構是新的，所以標題和按鈕正常；但 JS 行為對應到舊檔案的某個中間狀態），symptom 正好吻合：結構對、行為不對。

### 修法

1. 所有本機資源加上版本查詢字串，改一次版本就強制瀏覽器重新抓檔，不會再誤用快取：
   `index.html`：
   ```html
   <link rel="stylesheet" href="src/css/style.css?v=2" />
   ...
   <script src="src/js/ui.js?v=2"></script>
   ```
   （全部 8 個 `src/js/*.js` 與 `style.css` 都加了 `?v=2`；之後每次改動這些檔案要記得手動遞增版本號，否則等於沒做。）

2. 額外做防禦性修補：`wireDaylog()` 的渲染邏輯包上 `try/catch`，任何一筆紀錄格式異常都不該讓整個清單開天窗 —— 至少會落到「日誌讀取失敗，重新整理頁面再試一次。」這種看得懂的訊息，而不是安靜地留白。這不是本次症狀的根因，但屬於同一類「畫面該有內容卻空白」的問題，一併補強。

### 驗證

- `node --check src/js/ui.js`：語法過關
- 重跑 jsdom 模擬（含 `try/catch` 修改後的版本）：零筆與有筆兩種情境皆正確渲染
- 使用者操作面：清掉瀏覽器快取或直接關掉舊分頁重開一次 `index.html`，`?v=2` 會強制載入目前版本的 `ui.js`

### 教訓（第一輪，事後看是錯的診斷）

本機無 build 流程的專案，「檔案存了但畫面沒變」直覺會先懷疑快取。這個判斷方向沒錯，但**這次真正的根因跟快取無關** —— 下面「修正紀錄」是加了 `?v=2` 之後，使用者回報問題依然存在，重新調查才挖出的真正原因。cache-busting 本身沒有壞處，繼續留著，只是它不是這個 bug 的解法。

---

### 修正紀錄：真正的根因是 CSS，不是快取

使用者照 §調查方式 的建議，開 F12 → Console 看到一則錯誤：

```
Unsafe attempt to load URL file:///D:/LearnByMe/life-game/index.html from frame
with URL file:///D:/LearnByMe/life-game/index.html. 'file:' URLs are treated as
unique security origins.
```

逐行檢查全部程式碼後排除是這則錯誤造成的（找不到任何會載入 `index.html` 自己的程式碼：沒有 iframe、沒有指向本機檔案的 `window.open`、唯一的 `<form>` 裡也沒有會誤觸發原生送出的按鈕），判斷這是瀏覽器 / 預覽工具的旁支雜訊，**不是**真正原因 —— 關鍵線索反而是「Console 完全沒有我程式碼丟出的紅字錯誤」，代表 JS 邏輯有跑完、沒有例外，那問題應該在畫面渲染層。

請使用者切到 **Elements** 面板展開 `#daylog-list`，結果看到：

```html
<div id="daylog-panel" class="overlay" hidden>  [flex]
```

Chrome DevTools 在 `daylog-panel` 旁邊標了藍色 **`flex`** 徽章 —— 代表這個元素的**電腦運算後 `display` 值是 `flex`**，即使它明明帶著 `hidden` 屬性。這就是關鍵證據。

**真正根因**：`hidden` 屬性能生效，全靠瀏覽器內建樣式表裡一條很低優先度的規則 `[hidden] { display: none; }`。本站的 `.overlay { position: fixed; ...; display: flex; ... }` 用的是 class 選擇器，跟 `[hidden]` 的屬性選擇器**優先度打平**（都是 0,1,0）。CSS cascade 規則是「優先度打平時，author stylesheet 蓋過瀏覽器預設樣式（UA stylesheet）」—— 所以我自己寫的 `.overlay{display:flex}` 贏過瀏覽器內建的 `[hidden]{display:none}`，`hidden` 屬性形同虛設。**受影響的不只是心情日誌**：`.overlay`（onboarding、mood-checkin、definition-modal、task-detail、melt-confirm、settings-panel、daylog-panel 全部共用這個 class）跟 `.ceremony`（鍛造儀式）都設了 `display: flex`，全部都中這個 bug；`.wall__grid { display: grid }`（`#section-paused` 用到）也是同一個模式。

之所以「使用者走過 skip → 選心情 → 進主畫面」這段流程主觀上感覺是正常的，是因為多個 `.overlay` 元素疊在一起時，DOM 順序最後、z-index 相同的那個會蓋在最上面 —— 而 `daylog-panel` 剛好是 HTML 裡最後一個 `.overlay`，所以不管邏輯上有沒有被「打開」，它的視覺表現最顯眼、最容易被注意到是「空的」。

**真正的修法**：在 `src/css/style.css` 加一條全站通用的保底規則（放在檔案最前面，`* { box-sizing: border-box; }` 之後）：

```css
[hidden] { display: none !important; }
```

用 `!important` 是刻意的、標準做法（跟 normalize.css 的處理方式一樣）—— 這樣不管未來哪個 class 設了什麼 `display` 值，`hidden` 屬性永遠贏，一次修掉全站所有現在跟未來的同類元件，不用一個一個 class 加特殊選擇器。

**驗證**：用 `jsdom` 載入真實網頁後直接讀 `getComputedStyle(el).display`，逐一確認修好之前 / 之後的差異：

```
--- 修好之前（節錄）---
daylog-panel -> hidden attr: true | computed display: flex   ← 錯，該是 none

--- 修好之後 ---
daylog-panel -> hidden attr: true  | computed display: none   ← 對
daylog-panel -> hidden attr: false | computed display: flex   ← 打開時對
daylog-panel -> hidden attr: true  | computed display: none   ← 關閉後對
```

（`onboarding`、`mood-checkin`、`definition-modal`、`task-detail`、`melt-confirm`、`settings-panel`、`ceremony` 也一併重新檢查過，加了保底規則後全部在 `hidden=true` 時正確算出 `display: none`。）

### 教訓（更新版）

1. `hidden` 屬性不是「萬用隱藏」，它只是瀏覽器內建的一條普通、低優先度 CSS 規則。任何自己寫的、對同一元素設 `display` 的 class（尤其是 `display: flex`/`grid`，因為要用它們才能同時做 flex/grid 版面又用 `hidden` 控制顯示）都可能悄悄蓋掉它。**只要專案裡有任何 modal/overlay 用 `hidden` + `display: flex` 的組合，一開始就該補 `[hidden]{display:none!important}` 這條保底規則**，不要等到出事才修。
2. 這次真正找到根因，靠的是使用者提供的兩個具體證據：Console 錯誤（幫忙排除 JS 例外的可能）+ Elements 面板的 `computed display` 徽章（直接看到 `hidden` 沒生效）。純靠 `jsdom` 模擬 DOM 內容找不到這個 bug，因為 jsdom 不會做真的 CSS 排版計算跟 cascade —— 遇到「DOM 內容我確認是對的，但畫面看不到」這種症狀，要換成能看 computed style 的工具（真瀏覽器 DevTools，或至少能算 CSS cascade 的 headless 工具）。
3. 第一輪診斷（快取）方向合理但是錯的，錯了就承認、留紀錄、不要為了面子硬凹成「也是原因之一」—— 對照兩輪調查過程，本身就是很好的除錯範例。
