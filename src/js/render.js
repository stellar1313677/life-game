// 鐵匠鋪 — 畫面渲染
// 對應 docs/sdd-v2.md §6.1（捕捉層列表）、§10（展覽牆）。

(function () {
  "use strict";

  var showAllActive = false; // 心情密度限制的「顯示全部」暫時開關，不持久化

  function relativeTime(ts) {
    var diff = Date.now() - ts;
    var min = Math.floor(diff / 60000);
    if (min < 1) return "剛剛";
    if (min < 60) return min + " 分鐘前";
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + " 小時前";
    var day = Math.floor(hr / 24);
    return day + " 天前";
  }

  function skinOf(task) {
    if (!task.skin_id || !task.branch) return null;
    var list = Data.SKINS[task.branch] || [];
    return list.find(function (s) { return s.id === task.skin_id; }) || null;
  }

  function qualityColor(task) {
    if (task.quality_tier) return Data.QUALITY_META[task.quality_tier].color;
    return "var(--forge-ash)";
  }

  function epicPercent(task) {
    if (!task.milestones || task.milestones.length === 0) {
      return task.status === "COMPLETED" ? 100 : 0;
    }
    var done = task.milestones.filter(function (m) { return m.completed; });
    if (done.length === 0) return 0;
    return Math.max.apply(null, done.map(function (m) { return m.percent; }));
  }

  function traitLabel(t) {
    return t.level > 1 ? t.text + "+".repeat(t.level - 1) : t.text;
  }

  function buildTraitChips(traits, container) {
    traits.forEach(function (t) {
      var chip = document.createElement("span");
      chip.className = "trait-chip";
      if (t.tier === "CURIO") {
        chip.classList.add("trait-chip--curio");
      } else {
        chip.style.color = Data.QUALITY_META[t.tier].color;
        chip.style.borderColor = Data.QUALITY_META[t.tier].color;
      }
      chip.textContent = traitLabel(t);
      container.appendChild(chip);
    });
  }

  function card(task) {
    var el = document.createElement("article");
    el.className = "card card--" + task.type.toLowerCase() + " card--" + task.status.toLowerCase();
    el.dataset.taskId = task.id;
    el.style.setProperty("--quality-color", qualityColor(task));

    var fillPct = task.type === "EPIC" ? epicPercent(task) : Math.min(100, task.forge_count * 6);
    el.innerHTML =
      '<div class="card__fill" style="height:' + fillPct + '%"></div>' +
      '<div class="card__icon"></div>' +
      '<div class="card__body">' +
        '<p class="card__skin"></p>' +
        '<h3 class="card__title"></h3>' +
        '<p class="card__meta"></p>' +
      '</div>';

    var skin = skinOf(task);
    var iconWrap = el.querySelector(".card__icon");
    iconWrap.innerHTML = Data.renderSkinIcon(skin ? skin.glyph : "ore");
    el.querySelector(".card__skin").textContent = skin ? skin.name : (task.type === "LEGACY" ? "尚未鑄形" : "");
    el.querySelector(".card__title").textContent = task.title;

    var meta = el.querySelector(".card__meta");
    if (task.type === "EPIC") {
      meta.textContent = task.status === "COMPLETED"
        ? (task.quality || "")
        : epicPercent(task) + "%";
    } else {
      meta.textContent = task.status === "PAUSED"
        ? "靜置中・鍛造 " + task.forge_count + " 次"
        : "鍛造 " + task.forge_count + " 次";
    }

    if (task.traits && task.traits.length && (task.status === "COMPLETED" || task.type === "LEGACY")) {
      var chips = document.createElement("div");
      chips.className = "card__traits";
      buildTraitChips(task.traits, chips);
      el.querySelector(".card__body").appendChild(chips);
    }

    return el;
  }

  function densityCap() {
    var mood = State.currentMood();
    if (!mood) return Infinity;
    return Data.MOOD_META[mood].density;
  }

  function renderWall() {
    var activeTasks = State.data.tasks.filter(function (t) {
      return t.status === "ACTIVE";
    });
    var completedTasks = State.data.tasks
      .filter(function (t) { return t.status === "COMPLETED"; })
      .sort(function (a, b) { return (b.quality_tier || 0) - (a.quality_tier || 0); });
    var pausedTasks = State.data.tasks.filter(function (t) { return t.status === "PAUSED"; });

    var activeWrap = document.getElementById("section-active");
    activeWrap.innerHTML = "";
    var cap = densityCap();
    var visible = showAllActive ? activeTasks : activeTasks.slice(0, cap === Infinity ? activeTasks.length : cap);
    visible.forEach(function (t) { activeWrap.appendChild(card(t)); });
    if (!showAllActive && activeTasks.length > visible.length) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "btn btn--ghost wall__show-more";
      more.textContent = "顯示全部任務";
      more.addEventListener("click", function () { showAllActive = true; renderWall(); });
      activeWrap.appendChild(more);
    }
    if (activeTasks.length === 0) {
      activeWrap.innerHTML = '<p class="wall__empty">爐子空著，隨時可以開始。</p>';
    }

    var completedWrap = document.getElementById("section-completed");
    completedWrap.innerHTML = "";
    if (completedTasks.length === 0) {
      completedWrap.innerHTML = '<p class="wall__empty">還沒有鑄成的東西。</p>';
    } else {
      completedTasks.forEach(function (t) { completedWrap.appendChild(card(t)); });
    }

    var pausedCountEl = document.getElementById("paused-count");
    pausedCountEl.textContent = pausedTasks.length ? "(" + pausedTasks.length + ")" : "";
    var pausedWrap = document.getElementById("section-paused");
    pausedWrap.innerHTML = "";
    pausedTasks.forEach(function (t) { pausedWrap.appendChild(card(t)); });
    document.getElementById("paused-section").hidden = pausedTasks.length === 0;
  }

  function renderCaptureList() {
    var list = State.tasksByStatus("CAPTURED").sort(function (a, b) { return b.created_at - a.created_at; });
    var wrap = document.getElementById("capture-list");
    wrap.innerHTML = "";
    if (list.length === 0) {
      wrap.innerHTML = '<p class="capture-list__empty">暫存區是空的。</p>';
      return;
    }
    list.forEach(function (t) {
      var row = document.createElement("div");
      row.className = "capture-row";
      row.innerHTML =
        '<span class="capture-row__text"></span>' +
        '<span class="capture-row__time"></span>' +
        '<button type="button" class="btn btn--small btn--ghost capture-row__promote">升格</button>';
      row.querySelector(".capture-row__text").textContent = t.title;
      row.querySelector(".capture-row__time").textContent = relativeTime(t.created_at);
      row.querySelector(".capture-row__promote").addEventListener("click", function () {
        UI.openDefinition(t.id);
      });
      wrap.appendChild(row);
    });
  }

  function resetShowAll() { showAllActive = false; }

  window.Render = {
    renderWall: renderWall,
    renderCaptureList: renderCaptureList,
    relativeTime: relativeTime,
    skinOf: skinOf,
    traitLabel: traitLabel,
    buildTraitChips: buildTraitChips,
    epicPercent: epicPercent,
    resetShowAll: resetShowAll
  };
})();
