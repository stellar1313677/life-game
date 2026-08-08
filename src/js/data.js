// 鐵匠鋪 — 靜態資料
// 對應 docs/sdd-v2.md §2（分支）、§3（skin）、§7（詞條與品質）、§11（動物）
// 全域掛在 window.Data，供其餘腳本讀取。

(function () {
  "use strict";

  // ---- §2 世界觀分支 -------------------------------------------------

  var BRANCH_META = {
    MODERN: { label: "現代／科技", short: "現代" },
    XIANXIA: { label: "仙俠", short: "仙俠" },
    MAGIC: { label: "魔法", short: "魔法" }
  };

  var BRANCH_STORY = {
    MODERN: [
      "訊號在深夜接通。另一端的世界被異形佔據大部分的城市，他們的工廠早已停轉，剩下的人握著壞掉的槍，在遠離市區的小鎮生活。",
      "「我們已經一無所有，但我們還有時間，可以等，等待神器鍛成之日，奪回我們的城市。」",
      "你關掉通訊，打開爐子。訂單接下了。"
    ],
    XIANXIA: [
      "一封信自劍匣中浮出，字跡未乾。那界外域天魔入侵，門派凋零，練器師死傷殆盡，弟子手中無器可執。",
      "「此去山高路遠，不知歸期。待器成之日，自有人來取。」",
      "你將信收進袖中，起了爐火。"
    ],
    MAGIC: [
      "魔網的碎片使傳送陣亮了一瞬，落下一張羊皮紙。那個世界的魔網被摧毀，法師們的杖裂了，騎士的劍鏽了。",
      "「我們會一直等。直到神器見證下一位英雄的誕生。」",
      "你把紙釘在牆上，拉開風箱。"
    ]
  };

  // ---- §3 武器 Skin（MVP 僅 MODERN 分支開放 3 種，其餘列為文件參考） ----

  var SKINS = {
    MODERN: [
      { id: 1, name: "霰彈槍", form: "遠程・重", mvp: true, glyph: "shotgun" },
      { id: 2, name: "步槍", form: "遠程・標準", mvp: true, glyph: "rifle" },
      { id: 3, name: "手槍", form: "遠程・輕", mvp: false, glyph: "pistol" },
      { id: 4, name: "動力刀", form: "近戰", mvp: true, glyph: "blade" },
      { id: 5, name: "磁軌炮", form: "遠程・特大", mvp: false, glyph: "cannon" },
      { id: 6, name: "無人機", form: "輔助", mvp: false, glyph: "drone" },
      { id: 7, name: "護盾發生器", form: "防禦", mvp: false, glyph: "shield" },
      { id: 8, name: "電磁鞭", form: "近戰・異形", mvp: false, glyph: "whip" },
      { id: 9, name: "外骨骼拳套", form: "近戰・重", mvp: false, glyph: "gauntlet" },
      { id: 10, name: "訊號塔", form: "異形・裝置", mvp: false, glyph: "tower" }
    ],
    XIANXIA: [
      { id: 1, name: "飛劍", form: "近戰・經典", mvp: false, glyph: "blade" },
      { id: 2, name: "葫蘆", form: "輔助・容器", mvp: false, glyph: "gourd" },
      { id: 3, name: "符咒", form: "遠程・輕", mvp: false, glyph: "talisman" },
      { id: 4, name: "拂塵", form: "輔助・近戰", mvp: false, glyph: "whisk" },
      { id: 5, name: "玉笛", form: "輔助・音", mvp: false, glyph: "flute" },
      { id: 6, name: "陣盤", form: "裝置", mvp: false, glyph: "disc" },
      { id: 7, name: "油紙傘", form: "防禦・異形", mvp: false, glyph: "umbrella" },
      { id: 8, name: "銅鏡", form: "輔助・反制", mvp: false, glyph: "mirror" },
      { id: 9, name: "定海針", form: "近戰・重", mvp: false, glyph: "needle" },
      { id: 10, name: "丹爐", form: "裝置・煉製", mvp: false, glyph: "cauldron" }
    ],
    MAGIC: [
      { id: 1, name: "火球杖", form: "遠程・火", mvp: false, glyph: "staff" },
      { id: 2, name: "冰束杖", form: "遠程・冰", mvp: false, glyph: "staff" },
      { id: 3, name: "聖騎士劍", form: "近戰・重", mvp: false, glyph: "blade" },
      { id: 4, name: "魔導書", form: "輔助・施法", mvp: false, glyph: "book" },
      { id: 5, name: "精靈弓", form: "遠程・輕", mvp: false, glyph: "bow" },
      { id: 6, name: "骨杖", form: "遠程・暗", mvp: false, glyph: "staff" },
      { id: 7, name: "塔盾", form: "防禦", mvp: false, glyph: "shield" },
      { id: 8, name: "符文戰錘", form: "近戰・重", mvp: false, glyph: "hammer" },
      { id: 9, name: "水晶球", form: "裝置・預言", mvp: false, glyph: "orb" },
      { id: 10, name: "契約匕首", form: "近戰・輕", mvp: false, glyph: "dagger" }
    ]
  };

  // ---- §7.1 詞條庫（50 個形容詞，5 個 tier） --------------------------

  var TRAIT_POOL = {
    1: ["鈍的", "樸素的", "粗糙的", "沉重的", "老舊的", "普通的", "暗淡的", "笨拙的", "單薄的", "生鏽的", "廉價的", "無銘的"],
    2: ["鋒利的", "堅固的", "輕巧的", "平衡的", "可靠的", "耐用的", "順手的", "扎實的", "乾淨的", "溫熱的", "安靜的", "俐落的"],
    3: ["精準的", "冷冽的", "迅捷的", "通透的", "韌性的", "穩定的", "鋒銳的", "澄澈的", "致密的", "無聲的"],
    4: ["熾烈的", "共鳴的", "不朽的", "深邃的", "貫穿的", "逆流的", "灼心的", "蟄伏的"],
    5: ["唯一的", "寂靜的", "破曉的"]
  };

  // ---- §7.2 奇物詞條（CURIO，7 個，純彩蛋，不參與品質計算） ------------

  var CURIO_TRAITS = ["誠實的", "無用的", "醜陋的", "傷敵一千自損八百的", "會叫的", "話很多的", "認生的"];
  var CURIO_ROLL_CHANCE = 0.10;

  // ---- §7.4 品質顏色與視覺效果 -----------------------------------------

  var QUALITY_META = {
    1: { name: "凡鐵", color: "#9CA3AF", effect: "none" },
    2: { name: "精鋼", color: "#4ADE80", effect: "glow" },
    3: { name: "秘銀", color: "#60A5FA", effect: "flow" },
    4: { name: "符文", color: "#A78BFA", effect: "flow-rune" },
    5: { name: "傳說", color: "#FBBF24", effect: "legendary" }
  };
  var CURIO_META = { name: "奇物", color: "#C7CDD6" };

  // ---- §7.5 EPIC 詞條數量與 tier 抽取權重 -------------------------------
  // 亦供 §7.6 LEGACY 各門檻使用（以代表難度值取對應列）

  var DIFFICULTY_TABLE = [
    { max: 2, weights: [62, 25, 9, 3, 1], count: [1, 1] },
    { max: 4, weights: [42, 33, 17, 6, 2], count: [1, 2] },
    { max: 6, weights: [25, 35, 26, 11, 3], count: [2, 2] },
    { max: 8, weights: [12, 28, 36, 19, 5], count: [2, 3] },
    { max: 10, weights: [5, 18, 37, 31, 9], count: [3, 3] }
  ];

  function bucketFor(difficulty) {
    for (var i = 0; i < DIFFICULTY_TABLE.length; i++) {
      if (difficulty <= DIFFICULTY_TABLE[i].max) return DIFFICULTY_TABLE[i];
    }
    return DIFFICULTY_TABLE[DIFFICULTY_TABLE.length - 1];
  }

  // ---- §7.6 LEGACY 次數門檻 ---------------------------------------------

  var LEGACY_THRESHOLDS = {
    3: { newChance: 0.6, source: "MILESTONE_3", repDifficulty: 4 },
    7: { newChance: 0.5, source: "MILESTONE_7", repDifficulty: 6 },
    21: { newChance: 0.4, source: "MILESTONE_21", repDifficulty: 8 }
    // 50 為終焉鍛造，必定新增，另在 rolls.js 特殊處理
  };

  // ---- §5.2 心情狀態四向映射 --------------------------------------------

  var MOOD_META = {
    TENSE: { label: "緊繃", emoji: "🔥", density: 3, tone: "cold", response: "爐火已經升起來了。" },
    CALM: { label: "平靜", emoji: "🌾", density: Infinity, tone: "warm", response: "空氣很穩。" },
    TIRED: { label: "疲憊", emoji: "🌙", density: 1, tone: "ember", response: "今天只留一件事在檯面上。" },
    EXCITED: { label: "興奮", emoji: "✨", density: Infinity, tone: "bright", response: "火花已經在飛了。" },
    NUMB: { label: "麻木", emoji: "🩶", density: 1, tone: "gray", response: "什麼都不用做也可以。" }
  };
  var MOOD_ORDER = ["TENSE", "CALM", "TIRED", "EXCITED", "NUMB"];
  var QUIET_MOODS = { TIRED: true, NUMB: true };

  // ---- §11 背景動物 ------------------------------------------------------

  var ANIMALS = [
    { id: "WHALE", label: "鯨魚", layer: "far", widthPct: 22, opacity: 0.10, duration: 25, quiet: true },
    { id: "DEER", label: "鹿", layer: "far", widthPct: 8, opacity: 0.12, duration: 40, quiet: true },
    { id: "PAPER_CRANE", label: "紙鶴", layer: "mid-far", widthPct: 5, opacity: 0.15, duration: 15, quiet: false },
    { id: "FIREFLY", label: "螢火蟲群", layer: "mid", widthPct: 0.4, opacity: 0.18, duration: 30, quiet: true, swarm: true },
    { id: "FOX", label: "狐狸", layer: "mid", widthPct: 10, opacity: 0.15, duration: 12, quiet: false },
    { id: "CAT", label: "貓", layer: "mid-near", widthPct: 13, opacity: 0.15, duration: 20, quiet: false },
    { id: "OWL", label: "貓頭鷹", layer: "mid-near", widthPct: 11, opacity: 0.15, duration: 35, quiet: true },
    { id: "KOI", label: "錦鯉", layer: "near", widthPct: 15, opacity: 0.12, duration: 18, quiet: false },
    { id: "TURTLE", label: "烏龜", layer: "near", widthPct: 9, opacity: 0.15, duration: 30, quiet: false },
    { id: "SNAIL", label: "蝸牛", layer: "extreme-near", widthPct: 6, opacity: 0.20, duration: 40, quiet: true }
  ];
  var ANIMAL_MVP_DEFAULT = ["WHALE", "CAT", "FIREFLY"]; // §15.2 MVP 動物

  // §3.1：skin 完全隨機、等機率抽取。MVP 僅 mvp:true 的項目會被抽到。
  function pickRandomSkin(branch, excludeId) {
    var list = (SKINS[branch] || []).filter(function (s) {
      return s.mvp && s.id !== excludeId;
    });
    if (list.length === 0) list = (SKINS[branch] || []).filter(function (s) { return s.mvp; });
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  // ---- skin 圖示（程序化線稿，見 docs/bug.md #2）--------------------------
  // 每個 glyph key 對應一組 SVG path/shape 內容（viewBox 0 0 64 64），
  // 用 currentColor 上色，讓卡片能用品質色直接染色。目前只手繪了 MODERN
  // 分支 10 種 glyph；XIANXIA / MAGIC 分支尚未開放，未來要開時在這裡補。
  var GLYPH_ICONS = {
    shotgun:
      '<rect x="6" y="30" width="40" height="6" rx="1"/><rect x="6" y="30" width="14" height="6" rx="1" fill="currentColor" stroke="none"/>' +
      '<path d="M46 30 L52 24 M46 36 L52 40"/><path d="M20 36 L20 46 L28 46 L28 36"/><path d="M14 46 L18 52"/>',
    rifle:
      '<rect x="4" y="31" width="46" height="4" rx="1"/><circle cx="14" cy="24" r="4" fill="none"/><line x1="14" y1="20" x2="14" y2="16"/>' +
      '<path d="M50 31 L50 39" /><path d="M22 35 L22 46 L30 46 L30 35"/><path d="M16 46 L20 52"/>',
    pistol:
      '<rect x="16" y="26" width="30" height="8" rx="2"/><path d="M18 34 L18 48 L26 48 L26 36"/><path d="M46 30 L52 30"/>',
    blade:
      '<path d="M32 6 L38 40 L32 48 L26 40 Z"/><path d="M20 40 L44 40"/><path d="M32 48 L32 58"/><path d="M27 52 L37 52"/>',
    cannon:
      '<circle cx="24" cy="32" r="15"/><circle cx="24" cy="32" r="7"/><rect x="24" y="26" width="30" height="12" rx="2"/>' +
      '<circle cx="18" cy="50" r="5"/><circle cx="34" cy="50" r="5"/>',
    drone:
      '<circle cx="32" cy="32" r="8"/><line x1="14" y1="14" x2="24" y2="24"/><line x1="50" y1="14" x2="40" y2="24"/>' +
      '<line x1="14" y1="50" x2="24" y2="40"/><line x1="50" y1="50" x2="40" y2="40"/>' +
      '<circle cx="14" cy="14" r="4"/><circle cx="50" cy="14" r="4"/><circle cx="14" cy="50" r="4"/><circle cx="50" cy="50" r="4"/>',
    shield:
      '<path d="M32 6 L54 14 V32 C54 46 44 54 32 58 C20 54 10 46 10 32 V14 Z"/><path d="M32 18 L32 42 M22 30 L42 30"/>',
    whip:
      '<path d="M8 54 Q20 46 16 36 Q12 26 24 24 Q36 22 30 12 Q26 6 34 6"/>',
    gauntlet:
      '<rect x="14" y="24" width="26" height="20" rx="4"/><line x1="20" y1="24" x2="20" y2="44"/><line x1="27" y1="24" x2="27" y2="44"/><line x1="34" y1="24" x2="34" y2="44"/>' +
      '<path d="M40 30 L52 30 L52 38 L40 38"/>',
    tower:
      '<line x1="32" y1="4" x2="32" y2="20"/><circle cx="32" cy="4" r="3"/><path d="M32 20 L16 58 M32 20 L48 58 M22 40 L42 40"/>',
    // 尚未鑄形的原礦（LEGACY 首次鍛造前的預設圖示）
    ore:
      '<path d="M18 44 L12 30 L22 14 L40 10 L52 22 L50 40 L36 52 L20 50 Z"/><path d="M22 14 L30 26 L18 44 M40 10 L34 28 L50 40 M30 26 L36 52"/>'
  };
  var GLYPH_FALLBACK = '<path d="M32 8 L52 20 V44 L32 56 L12 44 V20 Z"/><path d="M32 8 V56 M12 20 L52 44 M52 20 L12 44"/>';

  function glyphMarkup(glyphKey) {
    return GLYPH_ICONS[glyphKey] || GLYPH_FALLBACK;
  }

  function renderSkinIcon(glyphKey) {
    return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + glyphMarkup(glyphKey) + '</svg>';
  }

  window.Data = {
    BRANCH_META: BRANCH_META,
    BRANCH_STORY: BRANCH_STORY,
    SKINS: SKINS,
    TRAIT_POOL: TRAIT_POOL,
    CURIO_TRAITS: CURIO_TRAITS,
    CURIO_ROLL_CHANCE: CURIO_ROLL_CHANCE,
    QUALITY_META: QUALITY_META,
    CURIO_META: CURIO_META,
    DIFFICULTY_TABLE: DIFFICULTY_TABLE,
    bucketFor: bucketFor,
    LEGACY_THRESHOLDS: LEGACY_THRESHOLDS,
    MOOD_META: MOOD_META,
    MOOD_ORDER: MOOD_ORDER,
    QUIET_MOODS: QUIET_MOODS,
    ANIMALS: ANIMALS,
    ANIMAL_MVP_DEFAULT: ANIMAL_MVP_DEFAULT,
    pickRandomSkin: pickRandomSkin,
    renderSkinIcon: renderSkinIcon
  };
})();
