# 開發日誌（第二天）

延續 [`day1log.md`](./day1log.md)。同樣一次工作階段一則，新的寫在最上面。

---

## 2026-08-09（把 SDD §15.3 P1/P2/P3 剩下的內容做完）

使用者要求把 `docs/sdd-v2.md` 剩下還沒做的部分做完。盤點後照 SDD 自己排的 P1 → P2 → P3 順序做：

### P1：補齊 MODERN 剩餘 skin

發現其實圖示早就全部畫好了（10 個 MODERN glyph 在 `GLYPH_ICONS` 裡都有），只是 `mvp:false` 把另外 7 種鎖住沒有拿去抽——單純是舊的 flag 設定沒跟上，改掉就好，不用重畫。

### P2：第二分支（仙俠）

- 幫仙俠 10 種 skin 各畫一組線稿圖示（飛劍、葫蘆、符咒、拂塵、玉笛、陣盤、油紙傘、銅鏡、定海針、丹爐），跟現代分支同一套風格（`viewBox 0 0 64 64`、`currentColor` 上色）
- `onboarding` 分支選擇畫面拿掉「即將開放」鎖定狀態，三個分支現在都能點
- **topbar 的分支切換原本只是個假按鈕**（點了跳一句「更多分支即將加入」就消失，什麼都沒發生）——這次真的做成下拉選單，列出三個分支，點選其中一個立刻切換，不用確認（照 §2.3）。切換只影響「之後」新造武器的 skin 池／展覽牆背景／動物配色，已經存在的任務保留原本的 `task.branch` 跟 `skin_id` 不受影響——這件事在資料層本來就是對的（`newTask()` 建立當下就把 branch 焊死在任務上），這次只是把「能切換」這個開關真的打開
- 展覽牆背景新增仙俠主題：懸浮陣紋（同心圓一圈圈的淡紋理）緩慢旋轉，模擬「靈氣流動」
- 動物剪影染色新增仙俠配色：`sepia + 降飽和度`，做出水墨/舊紙的感覺（§11.6）

### P3：第三分支（魔法）+ 心情日誌月曆

- 幫魔法 10 種 skin 各畫一組圖示（火球杖、冰束杖、聖騎士劍、魔導書、精靈弓、骨杖、塔盾、符文戰錘、水晶球、契約匕首）
- 展覽牆背景新增魔法主題：木紋直條紋理 + 畫面底部的爐火餘光
- **龍頭裝飾**（§10.1 明確要求的視覺元素）：畫了一個簡單線稿龍頭 SVG，固定在畫面左上角（`#dragon-decor`），寬度控制在 9vw（規格要求 ≤12%），只在魔法分支顯示，`pointer-events:none` 純裝飾不會擋到任何點擊
- 動物配色新增魔法主題：淡紫色調 + 柔和的 `drop-shadow` 光暈
- 心情日誌回顧從「倒序列表」改成**月曆熱區**（§13.2 明確要求的呈現方式，之前偷懶做成列表其實沒有照規格）：7 欄格線、有簽到的日子用心情色填滿格子且可點擊看當天備註，**沒簽到的日子純空白格、不能點、不上色、不顯示任何缺席提示**（這條規則比較重要，照 §13.2 的禁止清單刻意這樣做）；加了上一月/下一月導覽

### 過程中抓到的一個小 bug

寫分支動物染色 CSS 時，發現 `.animal-frame` 這個 class 被定義了兩次（一次是新加的分支染色規則，一次是原本背景動物那段的排版規則），兩條都設了 `color`/`filter`，後面那條會贏、把我新加的分支色蓋掉，等於白寫。寫的當下就發現並修掉了（拿掉舊那條裡的 `color`/`filter`，只留 `display`，色彩統一交給新規則管），沒有真的推上去才被抓到。

### 驗證

- `node --check` 全部 JS 過關，CSS 大括號平衡（208→214，新增內容沒破壞既有結構）
- HTML 標籤數量平衡檢查
- 交叉比對 `index.html` 的 `id` 屬性跟全部 JS 的 `getElementById` 呼叫，無缺漏
- 用 Node 直接測日期運算（月曆核心邏輯）：2026 年 8 月正確算出 31 天、8/1 是週六；2026 年 2 月正確算出 28 天（平年）；2028 年 2 月正確算出 29 天（閏年）——沒有偷懶只測一種情況
- 用最小 DOM stub 跑過一次 `UI.startApp()`，切換分支到仙俠/魔法後 `Data.pickRandomSkin()` 正確回傳該分支的武器（且 glyph 對得上剛畫的圖示），沒有拋出例外
- 沒有再嘗試 `JSDOM.fromURL` 完整瀏覽器模擬——連續三次在這台機器上卡住不回應（見前幾則日誌），這次直接跳過改用手動 DOM stub，省了等待卡住的時間

畫面上三個分支背景切換起來實際好不好看、龍頭裝飾大小位置順不順眼、月曆格子在小螢幕上會不會太擠，還是需要使用者實際看一次瀏覽器。

### 檔案異動

`src/js/data.js`（skin mvp 開放、20 個新圖示）、`src/js/ui.js`（分支切換、月曆回顧）、`src/css/style.css`（分支背景/動物配色/月曆樣式）、`index.html`（分支選單、龍頭裝飾、月曆結構）、`README.md`、這份日誌。

---

## 2026-08-09（追加：test.md 貼上沒反應，是 Chrome 擋的不是程式碼問題）

使用者回報 `test.md` 的指令貼進 Console 沒有用，截圖顯示 Chrome 跳出黃色警告「Don't paste code into the DevTools Console that you don't understand...」要求輸入 `allow pasting` 才放行。

這是 Chrome DevTools 內建的 self-XSS 防護，**任何網站的 Console 貼上任何程式碼都會先擋一次**，防止有人被騙貼惡意程式碼進去，跟 `test.md` 或這個專案的程式碼完全無關——不是 bug，不需要改程式碼。在 `docs/test.md` 開頭加了一段明顯的提醒：先在 Console 打 `allow pasting` 按 Enter 才能貼上執行（同一個 DevTools 分頁內有效，關掉重開要再打一次）。順便也把截圖裡同時出現、之前已經調查過確認無關的那則 `file://` frame 錯誤訊息也一併寫進提醒裡，避免使用者每次看到都以為是新問題。

### 檔案異動

`docs/test.md`（開頭加警告區塊）、這份日誌。
## 2026-08-09（新增：docs/test.md，各功能 console 測試指令集）

使用者要測試各項功能，想要一份可以直接貼到瀏覽器 Console 執行的指令集，不用每次都重新走一次完整 UI 流程（開場故事、心情簽到、逐步點表單）。

### 先補了幾個測試專用的匯出

寫測試指令時發現 `window.UI` 只匯出了 `wireAll`、`showOnboardingIfNeeded`、`openDefinition`，像 `openTaskDetail`、`runEpicCompletion`、`runLegacyForge`、`openMeltConfirm`、`closeTaskDetail`、`startApp` 這些其實一直都在，只是被關在 `ui.js` 的 IIFE 裡沒有掛到 `window.UI` 上，Console 完全叫不到，只能用 `dispatchEvent` 模擬點擊繞過去（麻煩且脆弱）。`animals.js` 同理，沒有任何辦法跳過 8–30 秒的隨機出場延遲立刻生一隻動物來看。

補了：

- `UI` 新增匯出：`startApp`、`openTaskDetail`、`closeTaskDetail`、`openMeltConfirm`、`runEpicCompletion`、`runLegacyForge`
- `Animals` 新增匯出：`forceSpawn()`（清掉目前排程的 timer，立刻呼叫一次 `spawnOne()`）

這些函式本來就存在、邏輯完全沒變，只是多掛到 window 物件上，純粹方便 Console 呼叫，不影響一般使用者的操作流程。

### `docs/test.md` 涵蓋範圍

依功能分 14 節：清空/檢視存檔、跳過開場直接進主畫面、捕捉層、定義層升格（含跳過表單的快速版）、EPIC 節點與鍛造儀式、LEGACY 鍛造次數門檻（含一次衝完 50 次看完整成長曲線的快速版）、品質計算公式驗證（對照 SDD §7.3 範例）、EPIC 詞條機率抽樣驗證（對照 §7.5 表格）、奇物詞條、熔毀/靜置、展覽牆密度規則、背景動物、skin 重鑄外觀、設定面板/Spotify/心情日誌回顧、完整重置。

每節盡量給「照真實流程點按鈕」跟「跳過 UI 直接改資料」兩種版本，讓使用者可以選要測 UI 本身還是只測邏輯結果。

### 驗證

- `node --check` 全部 JS 檔語法過關，CSS 大括號平衡
- 用 Node 個別 `require` 每個模組，逐一確認 `docs/test.md` 裡引用到的每個 `State.*`／`Data.*`／`Rolls.*`／`Render.*`／`Animals.*`／`UI.*` 函式都真的存在於對應的 `window.XXX` 匯出物件裡，沒有打錯字或漏匯出
- 覆查文件內容時抓到兩個自己寫錯的地方，寫的當下就直接修掉了：
  - §10（展覽牆密度）原本直接戳 `State.data.dayLogs[dayLogs.length-1].mood_tag`，改成用 `State.addDayLog()`（本來就是「一天一筆」upsert 的正規寫法，不用假設陣列順序）
  - §12（skin 重鑄外觀）原本沿用 §9 熔毀掉的 `epic` 物件，但重鑄外觀按鈕只在 `COMPLETED` 狀態才會出現，熔毀後的任務不會有——改成建立一個獨立、沒被前面步驟動過的任務

### 檔案異動

`src/js/ui.js`、`src/js/animals.js`（新增匯出）、`docs/test.md`（新增）、這份日誌。

使用者提供 `animal_pictures/dog/dog_1.png` ~ `dog_4.png` 四張真實跑步循環圖片，要求做成一隻會動的狗當背景小動物。這是 SDD §11.2 原始 10 種動物之外新增的第 11 種，也是系統第一次用真實圖片而非程序化 SVG 剪影當動物素材。

### 跟前一天 [`docs/animalsbug.md`](./animalsbug.md) #2 的關係

前一天把動物系統從「單張圖緩動搖擺」改成「2 幀 SVG 剪影真的互相切換」，架構（`animal-wrap` 位移／`animal-bob` 搖擺／`animal-frame` 幀圖）已經是對的，這次是在同一套架構上**擴充幀圖來源**，不是重做：

- `data.js`：`Data.ANIMALS` 新增 `DOG` 條目，`motion: "image"`，`frames` 給 4 張圖片路徑（照檔名數字順序），`facingLeft: true` 標記素材原始朝向（狗的圖朝左，其餘動物的 SVG 剪影預設朝右）。加進 `ANIMAL_MVP_DEFAULT`，不用特地去設定頁開才看得到。
- `animals.js`：
  - `makeFrameIcon()` 拆出 `frameContent()` 判斷幀圖來源——有 `animal.frames` 就直接輪流換 `<img src>`，沒有就沿用原本 `Data.renderAnimalFrame()` 產生 SVG；幀數從固定 2 張改成看 `frameCount(animal)`（狗是 4，其餘還是 2），用 `(frame + 1) % count` 循環，不再寫死 `1 - frame`
  - 鏡射邏輯從單純「CSS 選擇器判斷 rtl 就翻面」改成 JS 算好 `mirror = animal.facingLeft ? !reverse : reverse` 再直接掛 class——因為狗的素材天生朝左，跟其餘動物相反，用同一條 CSS 規則猜方向一定會有一邊是錯的
- `style.css`：`.animal-frame img` 補上 `object-fit:contain` 尺寸規則；`.animal-wrap--rtl .animal-frame{transform:scaleX(-1)}` 這條「用選擇器猜方向」的舊規則拿掉，改成 `.animal-frame--mirror` 工具類別，由 JS 依素材實際朝向決定要不要掛

### 驗證

`JSDOM.fromURL` 完整瀏覽器模擬在這台機器上又是卡住不回應（這是第三次遇到同樣的環境問題，已經不打算再花時間排查，直接認定是這台機器 + http.server + jsdom 資源載入的組合問題，不是程式碼問題）。改用手動 stub 最小 DOM 環境直接跑程式碼本體：

- 只啟用 DOG，觸發 `spawnOne()`，確認排入的計時器數量符合預期（1 個換幀 + 1 個離場）
- 手動觸發換幀 timer 4 次，確認圖片真的照 `dog_1 → dog_2 → dog_3 → dog_4 → dog_1` 順序循環，不是卡在同一張或亂序
- 用 `Math.random` mock 分別強迫「往左移動」跟「往右移動」兩種情境各跑一次，確認 `mirror` 的判斷結果跟預期相反方向一致（狗天生朝左，往左移動時不鏡射、往右移動時才鏡射）——第一次寫測試時因為 mock 命中錯的 `Math.random()` 呼叫順序（誤把決定初始高度的那次隨機當成方向判定），一度看到相反的結果，修正 mock 邏輯後才確認程式碼本身是對的

畫面上狗的動畫節奏、圖片跟其他動物的視覺風格搭不搭（真實插畫 vs. 其餘的抽象線稿剪影），還是需要使用者實際看一次瀏覽器。

### 檔案異動

`src/js/data.js`、`src/js/animals.js`、`src/css/style.css`、`README.md`（專案結構、開發狀態表更新）、這份新日誌檔。
