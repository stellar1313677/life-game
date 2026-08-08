// 鐵匠鋪 — 鍛造完成儀式
// 對應 docs/sdd-v2.md §8。詞條必須在儀式跑完才揭曉，不得提前顯示。

(function () {
  "use strict";

  function wait(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  function clearOverlay() {
    var overlay = document.getElementById("ceremony");
    overlay.className = "ceremony";
    document.getElementById("ceremony-skin").innerHTML = "";
    var q = document.getElementById("ceremony-quality");
    q.hidden = true;
    q.textContent = "";
    q.style.color = "";
    var traitsEl = document.getElementById("ceremony-traits");
    traitsEl.hidden = true;
    traitsEl.innerHTML = "";
    document.getElementById("ceremony-close").hidden = true;
  }

  // opts: { skinName, glyph, qualityName, qualityColor, traits: Trait[] (顯示順序，奇物須放最後) }
  function play(opts) {
    return new Promise(function (resolve) {
      var overlay = document.getElementById("ceremony");
      clearOverlay();
      overlay.hidden = false;
      document.body.classList.add("ceremony-active");

      var skinEl = document.getElementById("ceremony-skin");
      var qualityEl = document.getElementById("ceremony-quality");
      var traitsEl = document.getElementById("ceremony-traits");
      var closeBtn = document.getElementById("ceremony-close");

      skinEl.innerHTML = Data.renderSkinIcon(opts.glyph || "ore") + '<span class="ceremony__skin-name"></span>';
      skinEl.querySelector(".ceremony__skin-name").textContent = opts.skinName || "";

      (async function run() {
        overlay.classList.add("phase-dim");
        await wait(800);

        overlay.classList.remove("phase-dim");
        overlay.classList.add("phase-pulse");
        await wait(700);

        overlay.classList.remove("phase-pulse");
        overlay.classList.add("phase-reveal");
        if (opts.qualityName) {
          qualityEl.hidden = false;
          qualityEl.textContent = opts.qualityName;
          qualityEl.style.color = opts.qualityColor || "";
          overlay.style.setProperty("--quality-color", opts.qualityColor || "#d97b3f");
          if (opts.qualityName === "傳說") overlay.classList.add("phase-legendary");
        }
        await wait(800);

        overlay.classList.remove("phase-reveal");
        overlay.classList.add("phase-settle");
        traitsEl.hidden = false;
        var traits = opts.traits || [];
        for (var i = 0; i < traits.length; i++) {
          await wait(i === 0 ? 0 : 220);
          var t = traits[i];
          var chip = document.createElement("span");
          chip.className = "trait-chip trait-chip--reveal" + (t.tier === "CURIO" ? " trait-chip--curio" : "");
          if (t.tier !== "CURIO") {
            chip.style.color = Data.QUALITY_META[t.tier].color;
            chip.style.borderColor = Data.QUALITY_META[t.tier].color;
          }
          chip.textContent = Render.traitLabel(t);
          traitsEl.appendChild(chip);
        }
        await wait(300);

        closeBtn.hidden = false;
        closeBtn.focus();
      })();

      closeBtn.addEventListener("click", function onClose() {
        closeBtn.removeEventListener("click", onClose);
        overlay.hidden = true;
        document.body.classList.remove("ceremony-active");
        resolve();
      });
    });
  }

  window.Ceremony = { play: play };
})();
