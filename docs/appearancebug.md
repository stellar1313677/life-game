# 外觀 Bug 紀錄

畫面顯示／渲染類的 bug。格式：症狀 → 根因 → 修法 → 驗證。修好也留著，方便日後對照。

> 動物相關 bug 另外記在 [`docs/animalsbug.md`](./animalsbug.md)。

---

## #1　心情日誌面板打開後是空的

**狀態**：✅ 已修復

**症狀**：心情面板彈出，卡住介面，無法關閉。

**原因**：CSS 優先度問題。`hidden` 能否隱藏元素，靠 `[hidden]{display:none}` 規則。本站 `.overlay{display:flex}`（全站 7 個 modal 共用）優先度跟它打平，author stylesheet 蓋過瀏覽器預設，`hidden` 形同虛設。

**修法**：`style.css` 開頭加一條保底規則，一次修掉全部：

```css
[hidden] { display: none !important; }
```

**驗證**：`getComputedStyle` 逐一比對修前修後，全部元件在 `hidden=true` 時正確算出 `display:none`。

**教訓**：jsdom 不做真的 CSS cascade 運算，抓不到「內容有寫進去、畫面卻看不到」這類問題，要換真瀏覽器 DevTools。第一輪錯了就認錯，不硬凹。
