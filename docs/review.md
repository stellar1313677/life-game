# 程式碼導覽

給日後回來看程式碼的人（包含未來的自己）用的地圖，不是設計文件——設計決策看 `sdd-v2.md`，bug 歷史看 `appearancebug.md`/`animalsbug.md`。這份只回答一個問題：**這段程式在幹嘛，在哪一行**。

行號是寫這份文件當下（2026-08-09）的行號，之後每次改檔案都可能往下位移；行號對不太上時，用「功能」欄的關鍵字重新搜尋比對照行號快。

---

## index.html

```
1-10     文件開頭：DOCTYPE、meta、<title>、CSS 引入
         （含 ?v=2 快取版本號，見 appearancebug.md #1）
11       <body> 開始
13-14    分支背景層容器 #branch-bg（實際圖案由 CSS 依 body.branch-xxx 決定）
16-24    魔法分支專屬：龍頭裝飾 SVG #dragon-decor（固定左上角，純裝飾）
26-27    背景動物層容器 #animal-layer（動物 DOM 由 animals.js 動態塞進去）
29-40    首次啟動 Overlay：分支選擇 + 開場故事 #onboarding
         （分支卡片 #onboarding-branches、故事文字 #onboarding-story、
           跳過/拿起鐵鎚兩個按鈕）
42-50    Layer 0 心情簽到 Overlay #mood-checkin（唯一必經，5 個心情標籤 + 選填文字）
52-95    主畫面 #app-root
  55-69    topbar：左上分支切換器 #branch-switch + #branch-menu、
             中間標題、右上 Spotify/日誌/設定三個圖示按鈕
  71-84    展覽牆 #wall 三分區：鍛造中 / 已成之器 / 靜置區
  86-93    捕捉層：永遠可見的浮動輸入框 #capture-form + 暫存清單 #capture-list
97-137   定義層升格表單 Overlay #definition-modal
         （類型/標籤 segmented 選項、難度滑桿、EPIC 節點編輯器）
139-142  任務詳情 Overlay #task-detail（內容整段由 ui.js 動態產生，這裡只有空殼）
144-153  熔毀確認 Overlay #melt-confirm（§9.3 固定措辭）
155-163  鍛造完成儀式 Overlay #ceremony（skin/品質/詞條三個插槽，由 ceremony.js 控制時序）
165-182  設定面板 Overlay #settings-panel（動物開關、Spotify 歌單輸入）
184-198  心情日誌回顧 Overlay #daylog-panel（月曆熱區，上一月/下一月導覽）
200-207  8 個 <script> 依相依順序載入：
         data → state → rolls → animals → render → ceremony → ui → main
208-209  </body></html>
```

---

## src/css/style.css

```
1-23     CSS 變數：鍛造主題色票（--forge-black/panel/ember/ash...）+
         品質色 tier1-5（--q1~--q5）
25-33    全站 reset + [hidden] 保底規則（!important 強制 hidden 屬性生效，
         見 appearancebug.md #1，這是全站最重要的一條防呆規則）
35-52    html/body 基礎排版、表單元素繼承字型
54-60    心情主題色溫：5 種 mood 對應的 body 背景漸層（mood-cold/warm/ember/bright/gray）
62-123   通用元件：按鈕（.btn 各變體）、icon-btn、field 標籤、
         segmented 選項按鈕、文字輸入框
125-149  Overlay 共用基底（全螢幕遮罩 + 置中面板）
151-181  首次啟動：分支卡片 .branch-card、開場故事排版、跳過按鈕定位
183-205  心情簽到面板：心情標籤 .mood-tag、回應文字
207-236  主畫面 topbar 排版（標題置中、右側操作區）
238-263  分支切換下拉選單 .branch-menu（含目前分支的 active 高亮）
265      topbar__actions（右上角按鈕群）
267-293  展覽牆版面：三分區網格 .wall__grid、進行中卡片放大、
         靜置區半透明
295-359  卡片樣式：品質色邊框、進度填充動畫 .card__fill、
         skin 圖示 .card__icon、詞條 chip、奇物彩色流動漸層動畫（curio-flow）
361-418  捕捉層：浮動輸入條固定於畫面下緣、暫存清單彈出面板
420-429  定義層表單：節點編輯器 .milestone-row
431-461  任務詳情面板：進度條 .progress-bar、節點勾選列表
463-467  熔毀確認面板排版
469-501  設定面板 + 心情日誌月曆：動物開關網格、Spotify 輸入列、
         月曆格子 .daylog-cell（含已簽到/空白兩種狀態）
503-579  鍛造完成儀式：4 階段 keyframes（phase-dim/pulse/reveal/settle）、
         skin 顯現、品質文字發光、詞條逐一浮現動畫
581-591  全域鍛造中氛圍：儀式進行時其餘元素統一調暗
593-667  分支背景主題（§10.1）：現代金屬格線掃描、仙俠陣紋旋轉、
         魔法木紋爐火 + 龍頭裝飾；動物剪影染色（§11.6，三分支各異）
669-720  背景動物層：三層結構 CSS（.animal-wrap 位移／
         .animal-bob 走路搖擺／.animal-frame 幀圖與鏡射）
722-729  響應式：手機版 topbar/卡片網格調整
```

---

## src/js/data.js

```
1-6      檔頭註解 + IIFE 包裝開始（全域掛 window.Data）
8-32     §2 世界觀分支：BRANCH_META（三分支標籤）、
         BRANCH_STORY（三段開場故事全文）
34-74    §3 武器 Skin 資料：SKINS，三分支各 10 種
         （id/名稱/形態/mvp 開關/glyph 對應鍵）
76-84    §7.1 詞條庫：TRAIT_POOL，50 個形容詞分 5 個 tier
86-89    §7.2 奇物詞條：CURIO_TRAITS 7 個 + 抽取機率常數
91-103   §7.4 品質顏色 meta：QUALITY_META（5 級）+ CURIO_META
105-121  §7.5 難度機率表：DIFFICULTY_TABLE + bucketFor()
         （依難度找對應機率列）
123-130  §7.6 LEGACY_THRESHOLDS：3/7/21 次門檻的新增/升級機率
132-142  §5.2 心情狀態：MOOD_META 四向映射 + 順序 + 安靜組標記
144-168  §11 背景動物：ANIMALS 陣列，10 種原始 + 狗（真實圖片幀）
170-178  pickRandomSkin()：skin 完全隨機等機率抽選
180-223  skin 圖示資料 GLYPH_ICONS（30 種武器線稿 path）+
         glyphMarkup()/renderSkinIcon()
225-283  動物走路/游動幀圖 ANIMAL_FRAMES（5 種動作原型各 2 幀）+
         renderAnimalFrame()
285-355  window.Data 匯出（全部上面的資料與函式）
```

---

## src/js/state.js

```
1-9      檔頭 + uid()：產生任務/節點/日誌用的唯一 id
14-20    todayStr()：把 Date 轉成 YYYY-MM-DD
22-33    defaultState()：全新使用者的預設資料結構
35-54    load()：讀 localStorage，失敗或格式異常都退回預設值
56-65    save()：寫回 localStorage（含 try/catch，寫入失敗不中斷體驗）
67-75    todayLog()/currentMood()：查詢今天有沒有簽到、簽到的心情
77-89    addDayLog()：寫入心情日誌，「一天一筆」upsert
91-114   newTask()：建立新任務（Task 完整初始欄位，見 §4.1）
116-122  getTask()/tasksByStatus()：查詢函式
124-136  window.State 匯出
```

---

## src/js/rolls.js

```
1-6      檔頭
7-15     weightedTier()：依權重陣列做加權隨機抽選（1~5）
17-33    pickCount()（詞條數量抽選）、pickTraitText()、pickCurioText()
35-47    maybeRollCurio()：10% 機率額外抽 1 條奇物詞條，每把武器最多 1 條
49-64    rollEpicTraits()：§7.5 EPIC 一次性 roll 全部詞條
66-74    calcQualityTier()：§7.3 品質計算公式（平均 tier 四捨五入 + 金色保底）
76-80    applyQuality()：算完品質寫回 task.quality/quality_tier
82-89    completeEpic()：EPIC 完成入口（roll 詞條 + 鎖定 skin + 改狀態）
91-154   forgeLegacy()：§7.6 LEGACY 每次鍛造的完整邏輯
         （第 1/3/7/21/50 次門檻判斷、新增或升級詞條、順便判定奇物）
156-163  window.Rolls 匯出
```

---

## src/js/animals.js

```
1-16     檔頭 + 模組層級變數（畫布容器、上次出現的動物、排程 timer、專注模式旗標）
18-44    pickAnimal()：從啟用清單抽動物，排除安靜組限制、排除連續同種
46-48    rand()：區間隨機數小工具
50-91    makeFrameIcon()：建立單一幀圖 icon 元素，setTimeout 遞迴切換幀，
         SVG（程序化剪影）與 <img>（狗的真實圖片）兩種來源都走這條路
93-160   spawnOne()：實際生一隻動物——三層 DOM（wrap/bob/glyph）、
         景深位置、移動方向與鏡射判斷、螢火蟲群 3 光點特例、離場後排程下一次
162-165  scheduleNext()：設定下次出場的 timer
167-171  setFocusMode()：輸入框聚焦時動物變暗變慢
173-176  init()：啟動排程（開場後 8-30 秒內第一次出現）
178-184  window.Animals 匯出（含 forceSpawn 測試用捷徑）
```

---

## src/js/render.js

```
1-7      檔頭
9-18     relativeTime()：時間戳轉「3 天前」這類相對時間文字
20-29    skinOf()：依 task 找出對應 skin 資料、qualityColor()：品質色查詢
31-38    epicPercent()：EPIC 進度百分比（節點完成度或整體完成旗標）
40-42    traitLabel()：詞條顯示文字（含 level 疊加的「+」號）
44-57    buildTraitChips()：把詞條陣列畫成 chip 元素（奇物用專屬 class）
59-100   card()：單張任務卡片的完整 DOM 建立（品質色、skin 圖示、
         進度填充、標題、meta 文字、詞條列表）
102-106  densityCap()：依當前心情查詢任務顯示上限（§5.2）
108-148  renderWall()：展覽牆主渲染函式，三分區各自過濾/排序/畫卡片，
         含密度限制與「顯示全部」按鈕
150-172  renderCaptureList()：捕捉層暫存清單渲染
174      resetShowAll()：重置「顯示全部」暫時開關
176-186  window.Render 匯出
```

---

## src/js/ceremony.js

```
1-9      檔頭 + wait()：Promise 包裝的 setTimeout
11-23    clearOverlay()：每次播放前重置儀式畫面所有內容
26-89    play()：鍛造完成儀式主函式，opts 傳入 skin/品質/詞條資料，
         內部 async IIFE 依序跑 4 個階段（見 §8）：
           42-43   0-0.8s 聚焦（phase-dim）
           45-47   0.8-1.5s 敲擊（phase-pulse）
           49-58   1.5-2.3s 顯現（phase-reveal，品質色/文字揭曉）
           60-76   2.3-3.0s 落定（phase-settle，詞條逐一浮現，奇物最後）
           78-87   顯示「收下」按鈕，等使用者點擊才 resolve
91-92    window.Ceremony 匯出
```

---

## src/js/ui.js

最大的檔案，事件綁定跟畫面組裝幾乎都在這裡。

```
1-10     檔頭
12-27    renderOnboarding()：畫出 3 個分支選擇卡片
29-36    chooseBranch()：點選分支後顯示對應開場故事
38-44    finishOnboarding()：寫入分支設定、標記已完成引導、進下一步
46-54    showOnboardingIfNeeded()/afterOnboarding()：首次啟動判斷入口
60-73    renderMoodTags()：畫出 5 個心情標籤按鈕
75-88    submitMood()：送出心情、顯示回應文字、0.9 秒後自動關閉進主畫面
90-94    showMoodCheckinIfNeeded()：每次啟動的心情簽到判斷入口
100-107  startApp()：主畫面啟動總入口（套用主題、渲染牆面、啟動動物排程）
109-114  applyMoodTheme()：套用心情色溫 body class
116-125  applyBranchTheme()：套用分支背景/動物配色 body class + 更新 topbar 標籤
131-153  wireCapture()：捕捉層輸入框送出、暫存區展開/收合、
         輸入框聚焦觸發動物專注模式
159-180  openDefinition()：開啟定義層表單並重置成初始狀態
182-189  updateDifficultyHint()：難度滑桿數值對應的提示文字
191-203  addMilestoneRow()：新增一列節點編輯欄位
205-216  collectMilestones()：從表單收集所有節點，過濾無效輸入
218-271  wireDefinition()：定義層表單全部事件綁定
         （類型/標籤選擇、難度滑桿、加節點、取消、送出升格）
277-279  forgeHeat()：計算 LEGACY 任務的累積鍛造熱度
281-292  openTaskDetail()/closeTaskDetail()：任務詳情面板開關
294-341  buildTaskDetail()：任務詳情面板組裝（標題列 + 依類型分流 + 
         日誌區 + 回爐/關閉按鈕）
343-396  buildEpicBody()：EPIC 詳情內容（進度條、節點勾選、
         完成按鈕或品質+詞條展示）
398-454  buildLegacyBody()：LEGACY 詳情內容（鍛造/靜置/恢復按鈕、詞條列表）
456-471  buildReforgeButton()：重鑄外觀按鈕（一次性、免費換 skin）
473-501  buildLogSection()：任務日誌列表 + 隨手記輸入框
503-517  runEpicCompletion()：EPIC 完成流程（roll 詞條 → 存檔 → 播放儀式）
519-543  runLegacyForge()：LEGACY 鍛造流程（門檻判斷 → 存檔 → 播放儀式）
545-549  sortForReveal()：詞條顯示順序調整（奇物排最後）
555-578  openMeltConfirm()/wireMelt()：熔毀確認彈窗開關與確認邏輯
584-618  renderSettings()：設定面板內容（動物開關列表、Spotify 歌單輸入）
620-628  wireSettings()：設定面板開關按鈕綁定
634-653  daylogViewDate 狀態 + moodColor()（心情對應色票）+
         pad2()（補零）+ renderDaylogWeekdays()（畫星期標頭）
655-700  renderDaylogCalendar()：月曆主渲染（含防禦性 try/catch，
         見 appearancebug.md #1）
702-708  showDaylogDetail()：點擊有簽到的日期格顯示當天內容
710-728  wireDaylog()：日誌面板開啟/上下月導覽/關閉綁定
734-748  wireSpotify()：開啟 Spotify 深層連結（依當日心情找對應歌單）
754-766  renderBranchMenu()：畫出分支切換下拉選單選項
768-775  switchBranch()：實際切換分支（存檔 + 套用主題 + 關選單）
777-780  closeBranchMenu()：關閉分支選單
782-795  wireBranch()：分支切換按鈕與選單開關綁定（含點擊外部自動關閉）
801-810  wireWallClicks()：展覽牆卡片點擊委派、靜置區展開/收合
812-819  wireOnboarding()：開場故事「跳過」「拿起鐵鎚」按鈕綁定
821-831  wireAll()：所有 wire 函式的總入口，main.js 只呼叫這一個
833-846  window.UI 匯出（含專為 docs/test.md console 測試多開放的幾個函式）
```

---

## src/js/main.js

```
1-5      檔頭：說明啟動順序（對照 sdd-v2.md §1）
6-13     DOMContentLoaded 監聽：呼叫 UI.wireAll() 綁好全部事件，
         再呼叫 UI.showOnboardingIfNeeded() 開始判斷該從哪一步驟進入
```