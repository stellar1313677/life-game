# 外觀 Bug 紀錄

畫面顯示／渲染類的 bug，一個一則，格式：症狀 → 調查方式 → 根因 → 修法 → 驗證。修好的照樣留著，不刪，方便以後同類問題查對照。

> 動物相關的 bug（移動、動畫節奏等）獨立記在 [`docs/animalsbug.md`](./animalsbug.md)，不放這裡。
>
> 這份檔案原名 `bug.md`，2026-08-08 拆分成「外觀」跟「動物」兩份之後改名。

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

---

## #2　神器的 skin 沒有顯示

**狀態**：已修復（2026-08-08）

### 症狀

使用者測試時反映：卡片跟任務詳情看不出神器對應的 skin。

### 調查方式

用 jsdom 走一次真實流程（升格一個 EPIC 任務），直接檢查資料層：`task.skin_id`、`task.branch`、`Data.SKINS[branch]`、`Render.skinOf(task)`、卡片上 `.card__skin` 的 `textContent` —— 全部都對，`skin_id` 有正確指派、`Render.skinOf()` 找得到對應資料、卡片文字也確實寫出「霰彈槍」這種名稱。

### 根因

不是資料 bug，是**畫面上根本沒有畫出 skin 的圖示**。`data.js` 裡雖然每個 skin 都定義了 `glyph`（例如 `"shotgun"`、`"rifle"`），但這個欄位從頭到尾沒有任何地方拿去畫成圖案 —— 卡片只印了一行小字（skin 名稱），沒有對應的視覺符號。使用者說「沒有顯示」，講的其實是「看不到武器的樣子」，不是文字沒印出來。

### 修法

補上程序化 SVG 圖示系統：

1. `data.js` 新增 `GLYPH_ICONS`：10 種 MODERN skin 各自對應一組簡化線稿 SVG path（`viewBox 0 0 64 64`，用 `stroke="currentColor"`，這樣圖示顏色會自動吃卡片的品質色 CSS 變數），加一個 `ore`（原礦，LEGACY 尚未鍛造時的預設圖示）跟一個通用 fallback。新增 `Data.renderSkinIcon(glyphKey)` 回傳完整 `<svg>` 字串。
2. 三個顯示 skin 的地方都補上圖示：
   - `render.js` 的卡片：新增 `.card__icon` 區塊，疊在卡片上方置中
   - `ui.js` 的任務詳情面板標題：新增 `.task-detail__icon`，跟標題並排
   - `ceremony.js` 的鍛造儀式：`#ceremony-skin` 從純文字改成圖示 + 名稱直排
3. 對應補上 CSS（`.card__icon`、`.task-detail__icon`、`.ceremony__skin svg` 等）

仙俠 / 魔法分支的 glyph（`staff`、`bow`、`gourd`…）還沒畫，目前會落到 fallback 圖示；等那兩個分支開放時要記得補。

### 驗證

用 jsdom 走「升格為 EPIC」全流程，確認：卡片內確實有 `<svg>` 且含 4 個以上繪圖路徑元素；任務詳情面板的 head 區塊也確實有 `<svg>`。

---

## #3　已完成的神器也要能回爐

**狀態**：已依需求開放（2026-08-08，非缺陷，是規格調整）

### 背景

SDD §9.2 原規則：已完成神器（COMPLETED）預設不開放回爐，理由是「完成品是資產，不該有隨手刪的入口」，但文件本身也留了退路：「或需進入設定深層才可執行」。

### 使用者需求

實際測試時會想要把已經鑄成的神器直接回爐（測試資料清理很常見的需求），不想要多一層設定深層的關卡。

### 處理方式

這不是 bug，是使用者對 SDD 預設值的明確覆寫決定，尊重並直接實作：`ui.js` 的任務詳情面板拿掉「`status !== "COMPLETED"` 才顯示回爐按鈕」的限制，COMPLETED 的 EPIC 現在跟其他狀態一樣，任務詳情面板裡永遠有「回爐」按鈕，用同一套 §9.3 的確認文案（「回爐重來。這把就不留了。」），沒有另外加確認理由或警語。

### 驗證

用 jsdom 手動把一個任務的狀態設為 `COMPLETED` 後重新開啟任務詳情，確認「回爐」按鈕存在。
