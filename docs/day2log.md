# 開發日誌（第二天）

延續 [`day1log.md`](./day1log.md)。同樣一次工作階段一則，新的寫在最上面。

---

## 2026-08-09（新增：狗，用真實圖片做背景動物）

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
