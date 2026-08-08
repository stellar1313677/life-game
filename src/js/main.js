// 鐵匠鋪 — 入口腳本
// 啟動順序見 docs/sdd-v2.md §1：
//   首次啟動 → 分支選擇 + 開場故事（可跳過）
//   每次啟動 → Layer 0 心情簽到（唯一必經）→ 主畫面

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    UI.wireAll();
    UI.showOnboardingIfNeeded();
  });
})();
