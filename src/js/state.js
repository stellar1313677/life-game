// 鐵匠鋪 — 狀態存取層
// 對應 docs/sdd-v2.md §4（資料模型）。全部資料存在 localStorage，
// 單一 key，讀出後在記憶體操作，寫回時整包覆蓋。

(function () {
  "use strict";

  var STORAGE_KEY = "forge_state_v2";

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayStr(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function defaultState() {
    return {
      settings: {
        current_branch: null, // 首次啟動時選定
        animal_enabled: Data.ANIMAL_MVP_DEFAULT.slice(),
        spotify_playlists: {},
        onboarded: false
      },
      tasks: [],
      dayLogs: []
    };
  }

  function load() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      raw = null;
    }
    if (!raw) return defaultState();
    try {
      var parsed = JSON.parse(raw);
      // 淺層防呆：補齊可能缺漏的欄位（例如舊版資料）
      var base = defaultState();
      parsed.settings = Object.assign(base.settings, parsed.settings || {});
      parsed.tasks = parsed.tasks || [];
      parsed.dayLogs = parsed.dayLogs || [];
      return parsed;
    } catch (e) {
      return defaultState();
    }
  }

  var state = load();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage 不可用（隱私模式等）—— 靜默失敗，體驗仍可繼續，僅不持久化
      console.warn("鐵匠鋪：無法寫入 localStorage，本次進度不會被保存。", e);
    }
  }

  function todayLog() {
    var today = todayStr();
    return state.dayLogs.find(function (l) { return l.date === today; }) || null;
  }

  function currentMood() {
    var log = todayLog();
    return log ? log.mood_tag : null;
  }

  function addDayLog(moodTag, freeText) {
    var entry = {
      date: todayStr(),
      mood_tag: moodTag,
      free_text: freeText || null,
      created_at: Date.now()
    };
    // 一天一筆：若已存在則覆蓋（例如使用者重新整理後又簽到一次）
    var idx = state.dayLogs.findIndex(function (l) { return l.date === entry.date; });
    if (idx >= 0) state.dayLogs[idx] = entry; else state.dayLogs.push(entry);
    save();
    return entry;
  }

  function newTask(title) {
    var task = {
      id: uid(),
      title: title,
      type: null,
      status: "CAPTURED",
      tag: null,
      difficulty: null,
      branch: state.settings.current_branch,
      skin_id: null,
      reforge_used: false,
      created_at: Date.now(),
      promoted_at: null,
      milestones: [],
      forge_count: 0,
      forge_records: [],
      traits: [],
      quality: null,
      logs: []
    };
    state.tasks.push(task);
    save();
    return task;
  }

  function getTask(id) {
    return state.tasks.find(function (t) { return t.id === id; }) || null;
  }

  function tasksByStatus(status) {
    return state.tasks.filter(function (t) { return t.status === status; });
  }

  window.State = {
    uid: uid,
    todayStr: todayStr,
    data: state,
    save: save,
    todayLog: todayLog,
    currentMood: currentMood,
    addDayLog: addDayLog,
    newTask: newTask,
    getTask: getTask,
    tasksByStatus: tasksByStatus
  };
})();
