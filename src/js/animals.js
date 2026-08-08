// 鐵匠鋪 — 背景動物系統
// 對應 docs/sdd-v2.md §11。同時最多 1 隻，離場後隨機間隔才出現下一隻，
// 不設圖鑑、不設收集進度，僅作為「有沒有打開」的陪伴訊號。

(function () {
  "use strict";

  var GLYPH = {
    WHALE: "🐋", DEER: "🦌", PAPER_CRANE: "🕊️", FIREFLY: "✨", FOX: "🦊",
    CAT: "🐈", OWL: "🦉", KOI: "🐟", TURTLE: "🐢", SNAIL: "🐌"
  };

  var LAYER_TOP = {
    far: [8, 22], "mid-far": [22, 34], mid: [38, 58],
    "mid-near": [52, 68], near: [68, 82], "extreme-near": [82, 92]
  };

  var layerEl = null;
  var lastAnimalId = null;
  var spawnTimer = null;
  var focusActive = false;

  function pickAnimal() {
    var enabled = State.data.settings.animal_enabled || [];
    var mood = State.currentMood();
    var quiet = mood && Data.QUIET_MOODS[mood];
    var pool = Data.ANIMALS.filter(function (a) {
      if (enabled.indexOf(a.id) === -1) return false;
      if (quiet && !a.quiet) return false;
      if (a.id === lastAnimalId && pool_length_gt_one()) return false;
      return true;
    });

    function pool_length_gt_one() {
      var candidates = Data.ANIMALS.filter(function (a) {
        return enabled.indexOf(a.id) !== -1 && (!quiet || a.quiet);
      });
      return candidates.length > 1;
    }

    if (pool.length === 0) {
      // 排除規則導致池為空（例如只啟用 1 種）時，允許重複出現同一種
      pool = Data.ANIMALS.filter(function (a) {
        return enabled.indexOf(a.id) !== -1 && (!quiet || a.quiet);
      });
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spawnOne() {
    var animal = pickAnimal();
    if (!animal || !layerEl) {
      scheduleNext(60);
      return;
    }
    lastAnimalId = animal.id;

    // 三層結構：wrap 負責橫越畫面的長距離位移，bob 負責短週期的
    // 走路／游動搖擺節奏，glyph 只管透明度、大小跟面向鏡射。
    // 三層各自獨立設 transform，不會互相干擾（見 docs/bug.md #2）。
    var wrapper = document.createElement("div");
    wrapper.className = "animal-wrap";
    var topRange = LAYER_TOP[animal.layer] || [40, 60];
    var top = topRange[0] + Math.random() * (topRange[1] - topRange[0]);
    wrapper.style.top = top + "%";

    var duration = animal.duration * (focusActive ? 2 : 1);
    wrapper.style.setProperty("--duration", duration + "s");
    var reverse = Math.random() < 0.5;
    wrapper.classList.add(reverse ? "animal-wrap--rtl" : "animal-wrap--ltr");

    var bob = document.createElement("div");
    bob.className = "animal-bob";
    // 體型大、移動慢的動物搖擺週期拉長、幅度加大（鯨魚緩緩起伏），
    // 體型小、移動快的動物搖擺週期短、幅度小（狐狸/貓小碎步）。
    var bobDur = Math.max(0.5, Math.min(1.5, animal.duration / 22));
    var bobAmp = animal.swarm ? 3 : Math.max(3, Math.min(9, animal.widthPct / 2.2));
    bob.style.setProperty("--bob-dur", bobDur + "s");
    bob.style.setProperty("--bob-amp", bobAmp + "px");
    bob.style.setProperty("--bob-tilt", (2 + Math.random() * 3) + "deg");
    bob.style.animationDelay = "-" + (Math.random() * bobDur).toFixed(2) + "s"; // 避免每隻都同步搖擺

    var glyph = document.createElement("span");
    glyph.className = "animal-glyph";
    glyph.textContent = animal.swarm ? GLYPH[animal.id] + GLYPH[animal.id] + GLYPH[animal.id] : GLYPH[animal.id];
    glyph.style.opacity = animal.opacity;
    var sizeEm = Math.max(1.1, animal.widthPct / 4);
    glyph.style.fontSize = sizeEm + "rem";

    bob.appendChild(glyph);
    wrapper.appendChild(bob);
    layerEl.appendChild(wrapper);

    window.setTimeout(function () {
      wrapper.remove();
      var mood = State.currentMood();
      var gap = mood && Data.QUIET_MOODS[mood] ? rand(180, 300) : rand(60, 180);
      scheduleNext(gap);
    }, duration * 1000);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function scheduleNext(seconds) {
    window.clearTimeout(spawnTimer);
    spawnTimer = window.setTimeout(spawnOne, seconds * 1000);
  }

  function setFocusMode(active) {
    focusActive = active;
    if (!layerEl) return;
    layerEl.classList.toggle("is-focus", active);
  }

  function init() {
    layerEl = document.getElementById("animal-layer");
    scheduleNext(rand(8, 30)); // 開場後先給一個較短的初次等待
  }

  window.Animals = { init: init, setFocusMode: setFocusMode };
})();
