# 手動測試指令集

在瀏覽器打開 `index.html` 後，按 **F12** 開開發者工具，切到 **Console** 分頁，貼上以下任一段程式碼執行。全部指令都是直接呼叫 `window.State` / `Data` / `Rolls` / `Render` / `UI` / `Animals` / `Ceremony`（見 `src/js/*.js` 最後的 `window.XXX = {...}` 匯出區塊），不用真的一直用滑鼠點畫面。

> 有幾個內部函式（`UI.startApp`、`UI.openTaskDetail`、`UI.runEpicCompletion` 等）是特地為了這份測試文件才加進 `window.UI` 匯出的（見 `src/js/ui.js` 該處註解），純測試用途，不影響一般使用流程。

> ⚠️ **貼上第一段指令時，Console 會先擋下來**，顯示黃色警告「Don't paste code into the DevTools Console...」並要求輸入 `allow pasting` 才會放行。這是 Chrome 內建的 self-XSS 防護，**任何網站、任何貼上的程式碼都會觸發**，跟這份文件或這個專案的程式碼無關。直接在 Console 打 `allow pasting` 按 Enter，之後同一個 DevTools 分頁內都可以正常貼上執行（關掉 DevTools 重開會重置，要再打一次）。
>
> 另外可能會看到一則不相關的紅字錯誤：「Unsafe attempt to load URL file:///.../index.html from frame with URL file:///.../index.html...」——這是瀏覽器對 `file://` 頁面的雜訊（詳見 [`appearancebug.md` #1](./appearancebug.md#1心情日誌面板打開後是空的只有標題和關閉)的調查過程），已確認跟本專案程式碼無關，可以忽略。

## 0. 開始前：清空 / 檢視資料

```js
// 檢視目前存檔內容
JSON.parse(localStorage.getItem('forge_state_v2'))

// 清空存檔，回到全新狀態（會跳出開場故事）
localStorage.removeItem('forge_state_v2'); location.reload();
```

## 1. 跳過開場故事 + 心情簽到，直接進主畫面

真人流程是點「跳過故事」→ 點一個心情標籤。測試時懶得一直點，直接：

```js
State.data.settings.current_branch = 'MODERN';
State.data.settings.onboarded = true;
State.addDayLog('CALM', '測試用心情'); // 換成 TENSE / TIRED / EXCITED / NUMB 測試不同密度
document.getElementById('onboarding').hidden = true;
document.getElementById('mood-checkin').hidden = true;
UI.startApp();
```

若想連著測「心情簽到」本身的 UI（回應文字、標籤點擊），改成真的點畫面：

```js
document.getElementById('mood-free-text').value = '今天有點累';
document.querySelector('.mood-tag[data-mood="TIRED"]').click();
// 0.9 秒後面板會自動關閉、進主畫面
```

## 2. 捕捉層：新增任務

```js
State.newTask('倒垃圾');
State.newTask('讀完一本書');
Render.renderCaptureList();
// 打開暫存區面板看結果
document.getElementById('toggle-capture-list').click();
```

安全區規則檢查：捕捉層項目不該有任何紅點/數量提示——目視確認 `#capture-list` 裡只有文字跟相對時間，沒有其他裝飾。

## 3. 定義層：升格為 EPIC / LEGACY

**照真實流程**（會跳出定義層表單）：

```js
var t = State.tasksByStatus('CAPTURED')[0];
UI.openDefinition(t.id);
document.querySelector('#definition-type .segmented__opt[data-type="EPIC"]').click();
document.querySelector('#definition-tag .segmented__opt[data-tag="URGENT"]').click();
document.getElementById('definition-difficulty').value = 7;
document.getElementById('definition-difficulty').dispatchEvent(new Event('input'));
document.getElementById('definition-submit').click();
Render.renderWall();
```

**快速版**（跳過表單，直接寫欄位，適合大量造測試資料時用）：

```js
function quickPromote(title, type, difficulty) {
  var t = State.newTask(title);
  t.type = type; t.difficulty = difficulty; t.status = 'ACTIVE'; t.promoted_at = Date.now();
  if (type === 'EPIC') {
    var skin = Data.pickRandomSkin(t.branch);
    t.skin_id = skin ? skin.id : null;
  }
  State.save();
  return t;
}
var epic = quickPromote('快速 EPIC', 'EPIC', 8);
var legacy = quickPromote('快速 LEGACY', 'LEGACY', 5);
Render.renderWall();
```

## 4. EPIC：節點、完成、鍛造儀式

```js
// 加兩個節點
epic.milestones.push({ id: State.uid(), label: '第一階段', percent: 40, completed: false, completed_at: null, note: '' });
epic.milestones.push({ id: State.uid(), label: '完工', percent: 100, completed: false, completed_at: null, note: '' });
State.save();

// 打開任務詳情看進度條
UI.openTaskDetail(epic.id);

// 觸發完整鍛造完成儀式（4 階段動畫，含詞條 roll，全程約 3 秒 + 手動點「收下」關閉）
UI.runEpicCompletion(epic);
```

儀式跑完後檢查：

```js
console.log(epic.quality, epic.quality_tier, epic.traits);
Render.renderWall(); // 應該移到「已成之器」分區，依品質排序
```

## 5. LEGACY：鍛造次數門檻

**照真實流程**（一次一次鍛造，會跳鍛造儀式）：

```js
await UI.runLegacyForge(legacy); // 第 1 次：獲得原始詞條 + 鎖定 skin
await UI.runLegacyForge(legacy); // 第 2 次：無事件
await UI.runLegacyForge(legacy); // 第 3 次：60% 新增 / 40% 升級
```

**快速版**：跳過儀式動畫，一次衝到第 50 次看完整成長曲線：

```js
var t = quickPromote('快速衝門檻 LEGACY', 'LEGACY', 5);
for (var i = 0; i < 50; i++) {
  var result = Rolls.forgeLegacy(t, State.currentMood());
  if (t.forge_count === 1) {
    var skin = Data.pickRandomSkin(t.branch);
    t.skin_id = skin ? skin.id : null;
  }
  if ([1, 3, 7, 21, 50].includes(t.forge_count)) {
    console.log('forge #' + t.forge_count, JSON.stringify(result), '品質=', t.quality);
  }
}
State.save();
Render.renderWall();
console.log('最終詞條', t.traits, '鍛造熱度', t.forge_records.reduce((s, r) => s + r.power_gain, 0));
```

## 6. 品質計算公式驗證（純資料層，對照 SDD §7.3）

```js
console.log(Rolls.calcQualityTier([{ tier: 2 }, { tier: 2 }, { tier: 3 }])); // 期望 2（綠綠藍 → 綠）
console.log(Rolls.calcQualityTier([{ tier: 2 }, { tier: 2 }, { tier: 5 }])); // 期望 4（綠綠金 → 藍 → 金色保底 → 紫）
console.log(Rolls.calcQualityTier([{ tier: 5 }]));                          // 期望 5（單金 → 金）
console.log(Rolls.calcQualityTier([{ tier: 1 }, { tier: 'CURIO' }]));       // 奇物不參與計算，期望 1
```

## 7. EPIC 詞條機率抽樣驗證（對照 SDD §7.5 難度機率表）

```js
function sampleTierRate(difficulty, tier, n) {
  var hit = 0;
  for (var i = 0; i < n; i++) {
    var traits = Rolls.completeEpic({ difficulty: difficulty, traits: [] }, 1);
    if (traits.some(t => t.tier === tier)) hit++;
  }
  return (hit / n * 100).toFixed(2) + '%';
}
console.log('難度 1 出 tier5 機率（期望約 1%）：', sampleTierRate(1, 5, 5000));
console.log('難度 9 出 tier5 機率（期望約 9%）：', sampleTierRate(9, 5, 5000));
```

## 8. 奇物詞條（CURIO）測試

```js
// 強制抽到奇物：直接 roll 到出現為止（機率約 10%，通常幾次就中）
var traits;
do { traits = Rolls.completeEpic({ difficulty: 5, traits: [] }, 1); }
while (!traits.some(t => t.tier === 'CURIO'));
console.log(traits); // 應該看到一條 tier:'CURIO' 的詞條，且不影響上面算出的 quality

// 畫面上確認彩色漸層有跑起來：奇物詞條的文字應該是流動的彩色漸層，不是灰色
```

## 9. 熔毀 / 靜置

```js
// 靜置（LEGACY 專用）
legacy.status = 'PAUSED'; State.save(); Render.renderWall();
// 應該出現在「靜置區」，樣式較暗但不破損

// 恢復
legacy.status = 'ACTIVE'; State.save(); Render.renderWall();

// 熔毀確認流程（含已完成的 EPIC 也可以，見 appearancebug.md #3）
UI.openTaskDetail(epic.id);
UI.openMeltConfirm(epic.id);
document.getElementById('melt-confirm-yes').click(); // 或 melt-confirm-no 取消
Render.renderWall(); // 應該從牆上消失
console.log(State.getTask(epic.id).status); // 'MELTED'
```

## 10. 展覽牆密度規則（依心情狀態）

```js
// 造 5 個 ACTIVE EPIC，切不同心情看顯示上限（見 SDD §5.2）
for (var i = 0; i < 5; i++) quickPromote('密度測試 ' + i, 'EPIC', 5);

State.addDayLog('TENSE'); // addDayLog 是「一天一筆」upsert，今天已簽到過也會直接覆蓋
Render.resetShowAll(); Render.renderWall(); // 期望最多顯示 3 項 + 「顯示全部任務」按鈕

State.addDayLog('CALM');
Render.resetShowAll(); Render.renderWall(); // 期望全部顯示
```

## 11. 背景動物

```js
// 看目前啟用哪些動物
State.data.settings.animal_enabled

// 只留一種方便盯著看（狗、鯨魚都可以，狗是真實圖片 4 幀，其餘是 2 幀 SVG 剪影）
State.data.settings.animal_enabled = ['DOG']; State.save();

// 跳過隨機出場間隔，立刻生一隻（不用等 8-30 秒）
Animals.forceSpawn();

// 輸入專注模式：動物應該變暗變慢，離開輸入框 1.5 秒後緩慢恢復
document.getElementById('capture-input').focus();
document.getElementById('capture-input').blur();
```

## 12. Skin 重鑄外觀

用一個獨立的任務測試，不要沿用上面已經被熔毀的 `epic`（`reforge` 按鈕只在 COMPLETED 才會出現）：

```js
var reforgeTest = quickPromote('重鑄外觀測試', 'EPIC', 5);
Rolls.completeEpic(reforgeTest, reforgeTest.skin_id);
State.save();
console.log('原本 skin_id', reforgeTest.skin_id, Render.skinOf(reforgeTest));
UI.openTaskDetail(reforgeTest.id); // 點畫面上的「重鑄外觀」按鈕，應該換 skin 但不動詞條/品質，且只能點一次
```

## 13. 設定面板 / Spotify 深層連結 / 心情日誌回顧

```js
document.getElementById('open-settings').click(); // 檢查 10 種動物開關 + 5 個 mood 的歌單輸入框都在

document.getElementById('settings-close').click();

State.data.settings.spotify_playlists.CALM = '37i9dQZF1DXcBWIGoYBM5M'; State.save();
document.getElementById('open-spotify').click(); // 應該嘗試開 spotify: 深層連結，並在新分頁開網頁版

document.getElementById('open-daylog').click(); // 檢查歷史心情列表顏色跟 mood_tag 對應
```

## 14. 完整重置（測完想清乾淨重來）

```js
localStorage.removeItem('forge_state_v2');
location.reload();
```
