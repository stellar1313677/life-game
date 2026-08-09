// 鐵匠鋪 — 背景動物系統
// 對應 docs/sdd-v2.md §11。同時最多 1 隻，離場後隨機間隔才出現下一隻，
// 不設圖鑑、不設收集進度，僅作為「有沒有打開」的陪伴訊號。

(function () {
  "use strict";

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

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // 幀圖真的互相切換，不是靠 CSS 緩動硬撐出走路感（見 docs/animalsbug.md #2）。
  // 兩種來源：大部分動物用 Data.renderAnimalFrame() 產生的程序化 SVG（2 幀），
  // 有提供真實圖片的動物（目前只有狗，見 animal_pictures/）直接輪流換 <img src>，
  // 張數不限於 2（狗是 4 張）。換幀速度跟 bob 搖擺週期同步：走路/游動類每半個
  // 搖擺週期換一幀，螢火蟲用不規則間隔模擬自然明滅。回傳 stop() 讓呼叫端在
  // 動物離場時清掉 timer，避免殘留的 setTimeout 持續執行。
  function frameContent(animal, frameIndex) {
    if (animal.frames && animal.frames.length) {
      var url = animal.frames[frameIndex % animal.frames.length];
      return '<img src="' + url + '" alt="" draggable="false" />';
    }
    return Data.renderAnimalFrame(animal.motion, frameIndex);
  }

  function frameCount(animal) {
    return (animal.frames && animal.frames.length) || 2;
  }

  // mirror：素材原始朝向跟目前移動方向是否相反，相反時才鏡射
  // （多數程序化 SVG 預設朝右，狗的圖片素材朝左，見 data.js 的 facingLeft 註記）
  function makeFrameIcon(animal, widthRem, mirror) {
    var icon = document.createElement("span");
    icon.className = "animal-frame" + (mirror ? " animal-frame--mirror" : "");
    icon.style.width = widthRem + "rem";
    // 圖片素材大多接近方形，程序化 SVG 剪影固定用 2:1 橫幅 viewBox
    icon.style.height = (animal.frames ? widthRem : widthRem / 2) + "rem";
    var count = frameCount(animal);
    var frame = 0;
    icon.innerHTML = frameContent(animal, frame);

    var isFlicker = animal.motion === "flicker";
    var swapMs = isFlicker ? rand(260, 520) : Math.max(140, Math.min(650, (animal.duration / 22) * 500));
    var timerId = window.setTimeout(swap, Math.random() * swapMs); // 隨機起始相位，避免同步

    function swap() {
      frame = (frame + 1) % count;
      icon.innerHTML = frameContent(animal, frame);
      timerId = window.setTimeout(swap, isFlicker ? rand(260, 520) : swapMs);
    }

    return { el: icon, stop: function () { window.clearTimeout(timerId); } };
  }

  function spawnOne() {
    var animal = pickAnimal();
    if (!animal || !layerEl) {
      scheduleNext(60);
      return;
    }
    lastAnimalId = animal.id;

    // 三層結構：wrap 負責橫越畫面的長距離位移，bob 負責短週期的
    // 走路／游動搖擺節奏，glyph 裝的 icon 負責兩幀交替跟面向鏡射。
    // 三層各自獨立設 transform，不會互相干擾（見 docs/animalsbug.md #1）。
    var wrapper = document.createElement("div");
    wrapper.className = "animal-wrap";
    var topRange = LAYER_TOP[animal.layer] || [40, 60];
    var top = topRange[0] + Math.random() * (topRange[1] - topRange[0]);
    wrapper.style.top = top + "%";

    var duration = animal.duration * (focusActive ? 2 : 1);
    wrapper.style.setProperty("--duration", duration + "s");
    var reverse = Math.random() < 0.5;
    wrapper.classList.add(reverse ? "animal-wrap--rtl" : "animal-wrap--ltr");
    // 素材預設朝右的動物在 rtl（往左移動）時鏡射；朝左的素材（狗）相反
    var mirror = animal.facingLeft ? !reverse : reverse;

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
    glyph.style.opacity = animal.opacity;

    var stoppers = [];
    if (animal.swarm) {
      // 螢火蟲群：3 個各自獨立明滅的小光點，散開排列
      for (var i = 0; i < 3; i++) {
        var dot = makeFrameIcon(animal, 0.9, mirror);
        dot.el.style.marginLeft = i === 0 ? "0" : rand(0.3, 1.1) + "rem";
        dot.el.style.marginTop = rand(-0.5, 0.5) + "rem";
        glyph.appendChild(dot.el);
        stoppers.push(dot.stop);
      }
    } else {
      var widthRem = Math.max(2.2, animal.widthPct / 2);
      var icon = makeFrameIcon(animal, widthRem, mirror);
      glyph.appendChild(icon.el);
      stoppers.push(icon.stop);
    }

    bob.appendChild(glyph);
    wrapper.appendChild(bob);
    layerEl.appendChild(wrapper);

    window.setTimeout(function () {
      stoppers.forEach(function (stop) { stop(); });
      wrapper.remove();
      var mood = State.currentMood();
      var gap = mood && Data.QUIET_MOODS[mood] ? rand(180, 300) : rand(60, 180);
      scheduleNext(gap);
    }, duration * 1000);
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
