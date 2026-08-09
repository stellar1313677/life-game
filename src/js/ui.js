// 鐵匠鋪 — UI 事件與彈窗
// 對應 docs/sdd-v2.md §2（開場故事）、§5（心情簽到）、§6（捕捉/定義層）、
// §9（回爐/靜置）、§12（音樂）、§13.2（心情日誌回顧）。

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // 首次啟動：分支選擇 + 開場故事
  // ---------------------------------------------------------------------

  var onboardingChosenBranch = null;

  function renderOnboarding() {
    var grid = document.getElementById("onboarding-branches");
    grid.innerHTML = "";
    Object.keys(Data.BRANCH_META).forEach(function (key) {
      var meta = Data.BRANCH_META[key];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "branch-card";
      btn.innerHTML = '<span class="branch-card__label"></span>';
      btn.querySelector(".branch-card__label").textContent = meta.label;
      btn.addEventListener("click", function () { chooseBranch(key); });
      grid.appendChild(btn);
    });
  }

  function chooseBranch(key) {
    onboardingChosenBranch = key;
    document.getElementById("onboarding-branches").hidden = true;
    var storyWrap = document.getElementById("onboarding-story");
    storyWrap.hidden = false;
    document.getElementById("onboarding-story-text").innerHTML =
      Data.BRANCH_STORY[key].map(function (p) { return "<p>" + p + "</p>"; }).join("");
  }

  function finishOnboarding(branch) {
    State.data.settings.current_branch = branch;
    State.data.settings.onboarded = true;
    State.save();
    document.getElementById("onboarding").hidden = true;
    afterOnboarding();
  }

  function showOnboardingIfNeeded() {
    if (State.data.settings.onboarded) { afterOnboarding(); return; }
    renderOnboarding();
    document.getElementById("onboarding").hidden = false;
  }

  function afterOnboarding() {
    showMoodCheckinIfNeeded();
  }

  // ---------------------------------------------------------------------
  // Layer 0：心情簽到
  // ---------------------------------------------------------------------

  function renderMoodTags() {
    var wrap = document.getElementById("mood-tags");
    wrap.innerHTML = "";
    Data.MOOD_ORDER.forEach(function (key) {
      var meta = Data.MOOD_META[key];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mood-tag";
      btn.dataset.mood = key;
      btn.innerHTML = '<span class="mood-tag__emoji">' + meta.emoji + '</span>' + meta.label;
      btn.addEventListener("click", function () { submitMood(key); });
      wrap.appendChild(btn);
    });
  }

  function submitMood(key) {
    var text = document.getElementById("mood-free-text").value.trim();
    State.addDayLog(key, text || null);
    var respEl = document.getElementById("mood-response");
    respEl.textContent = Data.MOOD_META[key].response;
    document.querySelectorAll(".mood-tag").forEach(function (b) { b.disabled = true; });
    window.setTimeout(function () {
      document.getElementById("mood-checkin").hidden = true;
      document.getElementById("mood-free-text").value = "";
      respEl.textContent = "";
      document.querySelectorAll(".mood-tag").forEach(function (b) { b.disabled = false; });
      startApp();
    }, 900);
  }

  function showMoodCheckinIfNeeded() {
    if (State.todayLog()) { startApp(); return; }
    renderMoodTags();
    document.getElementById("mood-checkin").hidden = false;
  }

  // ---------------------------------------------------------------------
  // 主畫面啟動
  // ---------------------------------------------------------------------

  function startApp() {
    document.getElementById("app-root").hidden = false;
    applyMoodTheme();
    applyBranchTheme();
    Render.renderWall();
    Render.renderCaptureList();
    Animals.init();
  }

  function applyMoodTheme() {
    var mood = State.currentMood();
    var body = document.body;
    Data.MOOD_ORDER.forEach(function (m) { body.classList.remove("mood-" + Data.MOOD_META[m].tone); });
    if (mood) body.classList.add("mood-" + Data.MOOD_META[mood].tone);
  }

  // §10.1 分支背景 + §11.6 動物配色：靠 body 上的 branch-xxx class 切換 CSS，
  // 不用重繪牆面卡片（已存在的任務保留原本的 skin/branch，見 §2.3、§2.4）。
  function applyBranchTheme() {
    var branch = State.data.settings.current_branch;
    var body = document.body;
    Object.keys(Data.BRANCH_META).forEach(function (b) { body.classList.remove("branch-" + b.toLowerCase()); });
    if (branch) body.classList.add("branch-" + branch.toLowerCase());
    var branchBtn = document.getElementById("branch-switch");
    if (branchBtn) branchBtn.textContent = (Data.BRANCH_META[branch] || {}).short || "";
  }

  // ---------------------------------------------------------------------
  // 捕捉層
  // ---------------------------------------------------------------------

  function wireCapture() {
    document.getElementById("capture-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("capture-input");
      var title = input.value.trim();
      if (!title) return;
      State.newTask(title);
      input.value = "";
      Render.renderCaptureList();
    });

    var toggleBtn = document.getElementById("toggle-capture-list");
    toggleBtn.addEventListener("click", function () {
      var list = document.getElementById("capture-list");
      var open = list.hidden;
      list.hidden = !open;
      toggleBtn.setAttribute("aria-expanded", String(open));
    });

    var input = document.getElementById("capture-input");
    input.addEventListener("focus", function () { Animals.setFocusMode(true); });
    input.addEventListener("blur", function () { Animals.setFocusMode(false); });
  }

  // ---------------------------------------------------------------------
  // 定義層：升格表單
  // ---------------------------------------------------------------------

  var defState = { taskId: null, type: null, tag: "", milestones: [] };

  function openDefinition(taskId) {
    var task = State.getTask(taskId);
    if (!task) return;
    defState = { taskId: taskId, type: null, tag: "", milestones: [] };

    document.getElementById("definition-task-title").textContent = task.title;
    document.querySelectorAll("#definition-type .segmented__opt").forEach(function (b) {
      b.classList.remove("segmented__opt--active");
    });
    document.querySelectorAll("#definition-tag .segmented__opt").forEach(function (b) {
      b.classList.toggle("segmented__opt--active", b.dataset.tag === "");
    });
    document.getElementById("definition-difficulty").value = 5;
    updateDifficultyHint(5);
    document.getElementById("definition-milestones-field").hidden = true;
    document.getElementById("definition-milestones").innerHTML = "";
    document.getElementById("definition-submit").disabled = true;

    document.getElementById("definition-modal").hidden = false;
  }

  function updateDifficultyHint(val) {
    val = Number(val);
    var hint = val <= 3 ? "不太需要心理準備。"
      : val <= 6 ? "普通的份量。"
      : val <= 9 ? "需要推自己一把。"
      : "一直在逃避這件事。";
    document.getElementById("definition-difficulty-hint").textContent = hint;
  }

  function addMilestoneRow(label, percent) {
    var wrap = document.getElementById("definition-milestones");
    var row = document.createElement("div");
    row.className = "milestone-row";
    row.innerHTML =
      '<input type="text" class="milestone-row__label" placeholder="節點名稱" />' +
      '<input type="number" class="milestone-row__percent" min="1" max="100" placeholder="%" />' +
      '<button type="button" class="btn btn--ghost btn--small milestone-row__remove">移除</button>';
    row.querySelector(".milestone-row__label").value = label || "";
    row.querySelector(".milestone-row__percent").value = percent || "";
    row.querySelector(".milestone-row__remove").addEventListener("click", function () { row.remove(); });
    wrap.appendChild(row);
  }

  function collectMilestones() {
    var rows = document.querySelectorAll("#definition-milestones .milestone-row");
    var out = [];
    rows.forEach(function (row) {
      var label = row.querySelector(".milestone-row__label").value.trim();
      var pct = Number(row.querySelector(".milestone-row__percent").value);
      if (label && pct > 0 && pct <= 100) {
        out.push({ id: State.uid(), label: label, percent: pct, completed: false, completed_at: null, note: "" });
      }
    });
    return out;
  }

  function wireDefinition() {
    document.querySelectorAll("#definition-type .segmented__opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("#definition-type .segmented__opt").forEach(function (b) {
          b.classList.remove("segmented__opt--active");
        });
        btn.classList.add("segmented__opt--active");
        defState.type = btn.dataset.type;
        document.getElementById("definition-milestones-field").hidden = defState.type !== "EPIC";
        document.getElementById("definition-submit").disabled = false;
      });
    });

    document.querySelectorAll("#definition-tag .segmented__opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("#definition-tag .segmented__opt").forEach(function (b) {
          b.classList.remove("segmented__opt--active");
        });
        btn.classList.add("segmented__opt--active");
        defState.tag = btn.dataset.tag;
      });
    });

    document.getElementById("definition-difficulty").addEventListener("input", function (e) {
      updateDifficultyHint(e.target.value);
    });

    document.getElementById("definition-add-milestone").addEventListener("click", function () {
      addMilestoneRow("", "");
    });

    document.getElementById("definition-cancel").addEventListener("click", function () {
      document.getElementById("definition-modal").hidden = true;
    });

    document.getElementById("definition-submit").addEventListener("click", function () {
      var task = State.getTask(defState.taskId);
      if (!task || !defState.type) return;
      task.type = defState.type;
      task.tag = defState.tag || null;
      task.difficulty = Number(document.getElementById("definition-difficulty").value);
      task.status = "ACTIVE";
      task.promoted_at = Date.now();
      if (task.type === "EPIC") {
        task.milestones = collectMilestones();
        var skin = Data.pickRandomSkin(task.branch);
        task.skin_id = skin ? skin.id : null;
      }
      State.save();
      document.getElementById("definition-modal").hidden = true;
      Render.renderCaptureList();
      Render.renderWall();
    });
  }

  // ---------------------------------------------------------------------
  // 任務詳情：節點、鍛造、靜置、回爐、任務日誌
  // ---------------------------------------------------------------------

  function forgeHeat(task) {
    return task.forge_records.reduce(function (s, r) { return s + (r.power_gain || 0); }, 0);
  }

  function openTaskDetail(taskId) {
    var task = State.getTask(taskId);
    if (!task) return;
    var panel = document.getElementById("task-detail-panel");
    panel.innerHTML = "";
    panel.appendChild(buildTaskDetail(task));
    document.getElementById("task-detail").hidden = false;
  }

  function closeTaskDetail() {
    document.getElementById("task-detail").hidden = true;
  }

  function buildTaskDetail(task) {
    var frag = document.createElement("div");
    var skin = Render.skinOf(task);

    var head = document.createElement("div");
    head.className = "task-detail__head";
    if (task.quality_tier) head.style.setProperty("--quality-color", Data.QUALITY_META[task.quality_tier].color);
    head.innerHTML =
      '<div class="task-detail__icon"></div>' +
      '<div>' +
        '<h3 class="task-detail__title"></h3>' +
        '<p class="task-detail__skin"></p>' +
      '</div>';
    head.querySelector(".task-detail__icon").innerHTML = Data.renderSkinIcon(skin ? skin.glyph : "ore");
    head.querySelector(".task-detail__title").textContent = task.title;
    head.querySelector(".task-detail__skin").textContent =
      (skin ? skin.name + "・" : "") + (task.tag === "URGENT" ? "緊急" : task.tag === "DAILY" ? "日常" : "") +
      (task.difficulty ? "・難度 " + task.difficulty : "");
    frag.appendChild(head);

    if (task.type === "EPIC") {
      frag.appendChild(buildEpicBody(task));
    } else {
      frag.appendChild(buildLegacyBody(task));
    }

    frag.appendChild(buildLogSection(task));

    var actions = document.createElement("div");
    actions.className = "task-detail__actions";
    // SDD §9.2 預設不讓已完成神器回爐，但保留「或需進入設定深層才可執行」的
    // 開放彈性——使用者測試時明確要求直接可回爐，這裡照要求開放，不另外加關卡。
    var meltBtn = document.createElement("button");
    meltBtn.type = "button";
    meltBtn.className = "btn btn--danger-ghost";
    meltBtn.textContent = "回爐";
    meltBtn.addEventListener("click", function () { openMeltConfirm(task.id); });
    actions.appendChild(meltBtn);
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn btn--ghost";
    closeBtn.textContent = "關閉";
    closeBtn.addEventListener("click", closeTaskDetail);
    actions.appendChild(closeBtn);
    frag.appendChild(actions);

    return frag;
  }

  function buildEpicBody(task) {
    var wrap = document.createElement("div");
    wrap.className = "task-detail__body";

    var pct = Render.epicPercent(task);
    var bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.innerHTML = '<div class="progress-bar__fill" style="width:' + pct + '%"></div>';
    wrap.appendChild(bar);

    if (task.milestones.length) {
      var list = document.createElement("div");
      list.className = "milestone-list";
      task.milestones.forEach(function (m) {
        var row = document.createElement("label");
        row.className = "milestone-item" + (m.completed ? " milestone-item--done" : "");
        row.innerHTML =
          '<input type="checkbox" ' + (m.completed ? "checked" : "") + ' />' +
          '<span></span><em>' + m.percent + '%</em>';
        row.querySelector("span").textContent = m.label;
        row.querySelector("input").addEventListener("change", function (e) {
          m.completed = e.target.checked;
          m.completed_at = m.completed ? Date.now() : null;
          State.save();
          openTaskDetail(task.id); // 重繪（進度條需更新）
          Render.renderWall();
        });
        list.appendChild(row);
      });
      wrap.appendChild(list);
    }

    if (task.status === "ACTIVE") {
      var completeBtn = document.createElement("button");
      completeBtn.type = "button";
      completeBtn.className = "btn btn--primary";
      completeBtn.textContent = "獻上，鑄成";
      completeBtn.addEventListener("click", function () { runEpicCompletion(task); });
      wrap.appendChild(completeBtn);
    } else if (task.status === "COMPLETED") {
      var qWrap = document.createElement("p");
      qWrap.className = "task-detail__quality";
      qWrap.style.color = Data.QUALITY_META[task.quality_tier].color;
      qWrap.textContent = task.quality;
      wrap.appendChild(qWrap);
      var chips = document.createElement("div");
      chips.className = "card__traits";
      Render.buildTraitChips(task.traits, chips);
      wrap.appendChild(chips);
      wrap.appendChild(buildReforgeButton(task));
    }

    return wrap;
  }

  function buildLegacyBody(task) {
    var wrap = document.createElement("div");
    wrap.className = "task-detail__body";

    var stats = document.createElement("p");
    stats.className = "task-detail__stats";
    stats.textContent = "鍛造 " + task.forge_count + " 次・鍛造熱度 " + forgeHeat(task);
    wrap.appendChild(stats);

    if (task.traits.length) {
      var chips = document.createElement("div");
      chips.className = "card__traits";
      Render.buildTraitChips(task.traits, chips);
      wrap.appendChild(chips);
    }

    var btnRow = document.createElement("div");
    btnRow.className = "task-detail__btn-row";

    if (task.status === "ACTIVE") {
      var forgeBtn = document.createElement("button");
      forgeBtn.type = "button";
      forgeBtn.className = "btn btn--primary";
      forgeBtn.textContent = "鍛造";
      forgeBtn.addEventListener("click", function () { runLegacyForge(task); });
      btnRow.appendChild(forgeBtn);

      var pauseBtn = document.createElement("button");
      pauseBtn.type = "button";
      pauseBtn.className = "btn btn--ghost";
      pauseBtn.textContent = "靜置";
      pauseBtn.addEventListener("click", function () {
        task.status = "PAUSED";
        State.save();
        closeTaskDetail();
        Render.renderWall();
      });
      btnRow.appendChild(pauseBtn);
    } else if (task.status === "PAUSED") {
      var resumeBtn = document.createElement("button");
      resumeBtn.type = "button";
      resumeBtn.className = "btn btn--primary";
      resumeBtn.textContent = "恢復";
      resumeBtn.addEventListener("click", function () {
        task.status = "ACTIVE";
        State.save();
        closeTaskDetail();
        Render.renderWall();
      });
      btnRow.appendChild(resumeBtn);
    }
    wrap.appendChild(btnRow);

    if (task.forge_count > 0) wrap.appendChild(buildReforgeButton(task));

    return wrap;
  }

  function buildReforgeButton(task) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--ghost btn--small";
    btn.textContent = task.reforge_used ? "外觀已重鑄過" : "重鑄外觀（一次性、免費）";
    btn.disabled = task.reforge_used;
    btn.addEventListener("click", function () {
      var newSkin = Data.pickRandomSkin(task.branch, task.skin_id);
      if (newSkin) task.skin_id = newSkin.id;
      task.reforge_used = true;
      State.save();
      openTaskDetail(task.id);
      Render.renderWall();
    });
    return btn;
  }

  function buildLogSection(task) {
    var wrap = document.createElement("div");
    wrap.className = "task-detail__logs";
    var list = document.createElement("div");
    list.className = "log-list";
    task.logs.slice().reverse().forEach(function (l) {
      var row = document.createElement("p");
      row.className = "log-row";
      row.textContent = l.text;
      list.appendChild(row);
    });
    wrap.appendChild(list);

    var form = document.createElement("form");
    form.className = "log-form";
    form.innerHTML = '<input type="text" class="log-form__input" placeholder="隨手記一句（選填）" autocomplete="off" />';
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input");
      var text = input.value.trim();
      if (!text) return;
      task.logs.push({ id: State.uid(), text: text, created_at: Date.now() });
      State.save();
      input.value = "";
      openTaskDetail(task.id);
    });
    wrap.appendChild(form);
    return wrap;
  }

  async function runEpicCompletion(task) {
    var skin = Render.skinOf(task);
    var traits = Rolls.completeEpic(task, task.skin_id);
    State.save();
    closeTaskDetail();
    Render.renderWall();
    await Ceremony.play({
      skinName: skin ? skin.name : task.title,
      glyph: skin ? skin.glyph : "ore",
      qualityName: task.quality,
      qualityColor: Data.QUALITY_META[task.quality_tier].color,
      traits: sortForReveal(traits)
    });
    Render.renderWall();
  }

  async function runLegacyForge(task) {
    var result = Rolls.forgeLegacy(task, State.currentMood());
    if (task.forge_count === 1 && !task.skin_id) {
      var skin = Data.pickRandomSkin(task.branch);
      task.skin_id = skin ? skin.id : null;
    }
    State.save();
    closeTaskDetail();
    Render.renderWall();

    var revealTraits = [];
    if (result.newTrait) revealTraits.push(result.newTrait);
    if (result.leveledTrait) revealTraits.push(result.leveledTrait);
    if (result.curio) revealTraits.push(result.curio);

    var skinNow = Render.skinOf(task);
    await Ceremony.play({
      skinName: skinNow ? skinNow.name : task.title,
      glyph: skinNow ? skinNow.glyph : "ore",
      qualityName: task.quality,
      qualityColor: task.quality_tier ? Data.QUALITY_META[task.quality_tier].color : null,
      traits: revealTraits
    });
    Render.renderWall();
  }

  function sortForReveal(traits) {
    var real = traits.filter(function (t) { return t.tier !== "CURIO"; });
    var curio = traits.filter(function (t) { return t.tier === "CURIO"; });
    return real.concat(curio);
  }

  // ---------------------------------------------------------------------
  // 回爐確認
  // ---------------------------------------------------------------------

  var meltPendingId = null;

  function openMeltConfirm(taskId) {
    meltPendingId = taskId;
    document.getElementById("melt-confirm").hidden = false;
  }

  function wireMelt() {
    document.getElementById("melt-confirm-no").addEventListener("click", function () {
      document.getElementById("melt-confirm").hidden = true;
      meltPendingId = null;
    });
    document.getElementById("melt-confirm-yes").addEventListener("click", function () {
      var task = State.getTask(meltPendingId);
      if (task) {
        task.status = "MELTED";
        State.save();
      }
      document.getElementById("melt-confirm").hidden = true;
      meltPendingId = null;
      closeTaskDetail();
      Render.renderWall();
    });
  }

  // ---------------------------------------------------------------------
  // 設定面板
  // ---------------------------------------------------------------------

  function renderSettings() {
    var animalsWrap = document.getElementById("settings-animals");
    animalsWrap.innerHTML = "";
    Data.ANIMALS.forEach(function (a) {
      var label = document.createElement("label");
      label.className = "settings-animal";
      var enabled = State.data.settings.animal_enabled.indexOf(a.id) !== -1;
      label.innerHTML = '<input type="checkbox" ' + (enabled ? "checked" : "") + ' /><span></span>';
      label.querySelector("span").textContent = a.label;
      label.querySelector("input").addEventListener("change", function (e) {
        var list = State.data.settings.animal_enabled;
        var idx = list.indexOf(a.id);
        if (e.target.checked && idx === -1) list.push(a.id);
        if (!e.target.checked && idx !== -1) list.splice(idx, 1);
        State.save();
      });
      animalsWrap.appendChild(label);
    });

    var spotifyWrap = document.getElementById("settings-spotify");
    spotifyWrap.innerHTML = "";
    Data.MOOD_ORDER.forEach(function (key) {
      var row = document.createElement("label");
      row.className = "settings-spotify-row";
      row.innerHTML = '<span></span><input type="text" placeholder="playlist id" />';
      row.querySelector("span").textContent = Data.MOOD_META[key].label;
      var input = row.querySelector("input");
      input.value = State.data.settings.spotify_playlists[key] || "";
      input.addEventListener("change", function (e) {
        State.data.settings.spotify_playlists[key] = e.target.value.trim();
        State.save();
      });
      spotifyWrap.appendChild(row);
    });
  }

  function wireSettings() {
    document.getElementById("open-settings").addEventListener("click", function () {
      renderSettings();
      document.getElementById("settings-panel").hidden = false;
    });
    document.getElementById("settings-close").addEventListener("click", function () {
      document.getElementById("settings-panel").hidden = true;
    });
  }

  // ---------------------------------------------------------------------
  // 心情日誌回顧
  // ---------------------------------------------------------------------

  // §13.2：獨立回顧頁，以月曆熱區呈現（顏色 = mood_tag）。未簽到的日子單純
  // 留白，不標記、不變色、不統計缺席天數——這條規則比「好不好看」更重要。
  var daylogViewDate = new Date();

  function moodColor(tag) {
    var map = { TENSE: "#60A5FA", CALM: "#4ADE80", TIRED: "#A78BFA", EXCITED: "#FBBF24", NUMB: "#9CA3AF" };
    return map[tag] || "#9CA3AF";
  }

  function pad2(n) { return String(n).length < 2 ? "0" + n : String(n); }

  function renderDaylogWeekdays() {
    var el = document.getElementById("daylog-weekdays");
    if (el.childElementCount) return; // 只需要畫一次，跟月份無關
    ["日", "一", "二", "三", "四", "五", "六"].forEach(function (d) {
      var span = document.createElement("span");
      span.textContent = d;
      el.appendChild(span);
    });
  }

  function renderDaylogCalendar() {
    var grid = document.getElementById("daylog-list");
    var year = daylogViewDate.getFullYear();
    var month = daylogViewDate.getMonth(); // 0-indexed
    document.getElementById("daylog-month-label").textContent = year + " 年 " + (month + 1) + " 月";
    document.getElementById("daylog-detail").hidden = true;
    grid.innerHTML = "";

    // 防禦性 try/catch：任何一筆紀錄格式異常都不該讓整個月曆開天窗，
    // 至少要有東西可看（見 docs/appearancebug.md #1 的空白面板事故）。
    try {
      var logsByDate = {};
      (State.data.dayLogs || []).forEach(function (l) { logsByDate[l.date] = l; });

      var startOffset = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      for (var i = 0; i < startOffset; i++) {
        var blank = document.createElement("div");
        blank.className = "daylog-cell daylog-cell--pad";
        grid.appendChild(blank);
      }
      for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = year + "-" + pad2(month + 1) + "-" + pad2(d);
        var log = logsByDate[dateStr];
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "daylog-cell" + (log ? " daylog-cell--logged" : "");
        cell.textContent = String(d);
        if (log) {
          cell.style.setProperty("--cell-color", moodColor(log.mood_tag));
          var meta = Data.MOOD_META[log.mood_tag] || {};
          cell.title = meta.label || "";
          cell.addEventListener("click", function (entry) {
            return function () { showDaylogDetail(entry); };
          }(log));
        } else {
          cell.disabled = true; // 空白日不可互動，也不做任何缺席提示
        }
        grid.appendChild(cell);
      }
    } catch (err) {
      console.error("鐵匠鋪：心情日誌月曆渲染失敗", err);
      grid.innerHTML = '<p class="wall__empty">日曆讀取失敗，重新整理頁面再試一次。</p>';
    }
  }

  function showDaylogDetail(log) {
    var meta = Data.MOOD_META[log.mood_tag] || {};
    var el = document.getElementById("daylog-detail");
    el.hidden = false;
    el.style.borderColor = moodColor(log.mood_tag);
    el.textContent = log.date + "・" + (meta.emoji || "") + " " + (meta.label || "") + (log.free_text ? "：" + log.free_text : "");
  }

  function wireDaylog() {
    document.getElementById("open-daylog").addEventListener("click", function () {
      daylogViewDate = new Date(); // 每次打開都回到本月
      renderDaylogWeekdays();
      renderDaylogCalendar();
      document.getElementById("daylog-panel").hidden = false;
    });
    document.getElementById("daylog-prev").addEventListener("click", function () {
      daylogViewDate = new Date(daylogViewDate.getFullYear(), daylogViewDate.getMonth() - 1, 1);
      renderDaylogCalendar();
    });
    document.getElementById("daylog-next").addEventListener("click", function () {
      daylogViewDate = new Date(daylogViewDate.getFullYear(), daylogViewDate.getMonth() + 1, 1);
      renderDaylogCalendar();
    });
    document.getElementById("daylog-close").addEventListener("click", function () {
      document.getElementById("daylog-panel").hidden = true;
    });
  }

  // ---------------------------------------------------------------------
  // 音樂深層連結
  // ---------------------------------------------------------------------

  function wireSpotify() {
    document.getElementById("open-spotify").addEventListener("click", function () {
      var mood = State.currentMood();
      var id = mood ? State.data.settings.spotify_playlists[mood] : null;
      if (!id) {
        renderSettings();
        document.getElementById("settings-panel").hidden = false;
        return;
      }
      window.location.href = "spotify:playlist:" + id;
      window.setTimeout(function () {
        window.open("https://open.spotify.com/playlist/" + id, "_blank");
      }, 400);
    });
  }

  // ---------------------------------------------------------------------
  // 分支切換（§2.3：入口位於左上角，隨時可改，不需確認）
  // ---------------------------------------------------------------------

  function renderBranchMenu() {
    var wrap = document.getElementById("branch-menu-options");
    wrap.innerHTML = "";
    Object.keys(Data.BRANCH_META).forEach(function (key) {
      var meta = Data.BRANCH_META[key];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "branch-menu__opt" + (key === State.data.settings.current_branch ? " branch-menu__opt--active" : "");
      btn.textContent = meta.label;
      btn.addEventListener("click", function () { switchBranch(key); });
      wrap.appendChild(btn);
    });
  }

  function switchBranch(key) {
    // 只影響「之後」新造武器的 skin 池、展覽牆背景、動物配色風格；
    // 已存在的任務保留原本 task.branch/skin_id 不受影響（§2.3、§2.4）。
    State.data.settings.current_branch = key;
    State.save();
    applyBranchTheme();
    closeBranchMenu();
  }

  function closeBranchMenu() {
    document.getElementById("branch-menu").hidden = true;
    document.getElementById("branch-switch").setAttribute("aria-expanded", "false");
  }

  function wireBranch() {
    var btn = document.getElementById("branch-switch");
    var menu = document.getElementById("branch-menu");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      if (willOpen) renderBranchMenu();
      menu.hidden = !willOpen;
      btn.setAttribute("aria-expanded", String(willOpen));
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && e.target !== btn && !menu.contains(e.target)) closeBranchMenu();
    });
  }

  // ---------------------------------------------------------------------
  // 任務卡片點擊（事件委派）
  // ---------------------------------------------------------------------

  function wireWallClicks() {
    document.getElementById("wall").addEventListener("click", function (e) {
      var cardEl = e.target.closest(".card");
      if (cardEl) openTaskDetail(cardEl.dataset.taskId);
    });
    document.getElementById("toggle-paused").addEventListener("click", function () {
      var el = document.getElementById("section-paused");
      el.hidden = !el.hidden;
    });
  }

  function wireOnboarding() {
    document.getElementById("onboarding-skip").addEventListener("click", function () {
      finishOnboarding(onboardingChosenBranch || "MODERN");
    });
    document.getElementById("onboarding-enter").addEventListener("click", function () {
      finishOnboarding(onboardingChosenBranch || "MODERN");
    });
  }

  function wireAll() {
    wireOnboarding();
    wireCapture();
    wireDefinition();
    wireMelt();
    wireSettings();
    wireDaylog();
    wireSpotify();
    wireBranch();
    wireWallClicks();
  }

  window.UI = {
    wireAll: wireAll,
    showOnboardingIfNeeded: showOnboardingIfNeeded,
    openDefinition: openDefinition,
    // 以下純粹為了讓 docs/test.md 的 console 測試指令能直接呼叫，
    // 不用每次都用 dispatchEvent 模擬點擊；不影響一般使用流程。
    startApp: startApp,
    openTaskDetail: openTaskDetail,
    closeTaskDetail: closeTaskDetail,
    openMeltConfirm: openMeltConfirm,
    runEpicCompletion: runEpicCompletion,
    runLegacyForge: runLegacyForge
  };
})();
