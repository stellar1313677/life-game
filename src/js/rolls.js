// 鐵匠鋪 — 抽選與品質計算
// 對應 docs/sdd-v2.md §7（詞條與品質系統）。

(function () {
  "use strict";

  function weightedTier(weights) {
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < weights.length; i++) {
      if (r < weights[i]) return i + 1;
      r -= weights[i];
    }
    return weights.length;
  }

  function pickCount(range) {
    var min = range[0], max = range[1];
    if (min === max) return min;
    return Math.random() < 0.5 ? min : max;
  }

  function pickTraitText(tier, usedTexts) {
    var pool = Data.TRAIT_POOL[tier].filter(function (t) { return !usedTexts.has(t); });
    if (pool.length === 0) pool = Data.TRAIT_POOL[tier]; // 池用盡則允許重複（機率極低才會發生）
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pickCurioText(usedTexts) {
    var pool = Data.CURIO_TRAITS.filter(function (t) { return !usedTexts.has(t); });
    if (pool.length === 0) pool = Data.CURIO_TRAITS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function maybeRollCurio(existingTraits) {
    var hasCurio = existingTraits.some(function (t) { return t.tier === "CURIO"; });
    if (hasCurio) return null;
    if (Math.random() >= Data.CURIO_ROLL_CHANCE) return null;
    var used = new Set(existingTraits.map(function (t) { return t.text; }));
    return {
      text: pickCurioText(used),
      tier: "CURIO",
      level: 1,
      obtained_at: Date.now(),
      source: "INITIAL"
    };
  }

  // §7.5 EPIC：完成當下一次性 roll 全部詞條
  function rollEpicTraits(difficulty) {
    var bucket = Data.bucketFor(difficulty);
    var count = pickCount(bucket.count);
    var used = new Set();
    var traits = [];
    for (var i = 0; i < count; i++) {
      var tier = weightedTier(bucket.weights);
      var text = pickTraitText(tier, used);
      used.add(text);
      traits.push({ text: text, tier: tier, level: 1, obtained_at: Date.now(), source: "INITIAL" });
    }
    var curio = maybeRollCurio(traits);
    if (curio) traits.push(curio);
    return traits;
  }

  // §7.3 品質計算：非奇物詞條 tier 平均，四捨五入；金色保底至少紫
  function calcQualityTier(traits) {
    var real = traits.filter(function (t) { return t.tier !== "CURIO"; });
    if (real.length === 0) return null;
    var avg = real.reduce(function (s, t) { return s + t.tier; }, 0) / real.length;
    var tier = Math.round(avg);
    if (real.some(function (t) { return t.tier === 5; })) tier = Math.max(tier, 4);
    return Math.min(Math.max(tier, 1), 5);
  }

  function applyQuality(task) {
    var tier = calcQualityTier(task.traits);
    task.quality = tier ? Data.QUALITY_META[tier].name : null;
    task.quality_tier = tier;
  }

  // 完成 EPIC：roll 詞條、算品質、鎖定 skin
  function completeEpic(task, skinId) {
    task.traits = rollEpicTraits(task.difficulty || 5);
    applyQuality(task);
    task.status = "COMPLETED";
    task.skin_id = skinId;
    return task.traits;
  }

  // §7.6 LEGACY：每次鍛造
  // 回傳 { newTrait, leveledTrait } 供鍛造儀式顯示本次結果
  function forgeLegacy(task, moodTag) {
    var idx = task.forge_count + 1;
    task.forge_count = idx;
    task.forge_records.push({
      forge_index: idx,
      forged_at: Date.now(),
      mood_at_time: moodTag || null,
      power_gain: task.difficulty || 5,
      note: null
    });

    var result = { newTrait: null, leveledTrait: null, curio: null };

    if (idx === 1) {
      // 初次鍛造成形：固定使用 §7.5 表格 1–2 列，不受本次難度影響
      var bucket1 = Data.bucketFor(2);
      var tier1 = weightedTier(bucket1.weights);
      var text1 = pickTraitText(tier1, new Set());
      var trait1 = { text: text1, tier: tier1, level: 1, obtained_at: Date.now(), source: "INITIAL" };
      task.traits.push(trait1);
      result.newTrait = trait1;
    } else if (Data.LEGACY_THRESHOLDS[idx]) {
      var rule = Data.LEGACY_THRESHOLDS[idx];
      var bucket = Data.bucketFor(rule.repDifficulty);
      if (Math.random() < rule.newChance) {
        var used = new Set(task.traits.map(function (t) { return t.text; }));
        var tier = weightedTier(bucket.weights);
        var text = pickTraitText(tier, used);
        var trait = { text: text, tier: tier, level: 1, obtained_at: Date.now(), source: rule.source };
        task.traits.push(trait);
        result.newTrait = trait;
      } else {
        var real = task.traits.filter(function (t) { return t.tier !== "CURIO"; });
        var pick = real[Math.floor(Math.random() * real.length)];
        if (pick) {
          pick.level += 1;
          result.leveledTrait = pick;
        }
      }
    } else if (idx === 50) {
      // 終焉鍛造：必定新增 1 條 + 全部既有詞條 +1 級
      var bucket50 = Data.bucketFor(8);
      var used50 = new Set(task.traits.map(function (t) { return t.text; }));
      var tier50 = weightedTier(bucket50.weights);
      var text50 = pickTraitText(tier50, used50);
      var trait50 = { text: text50, tier: tier50, level: 1, obtained_at: Date.now(), source: "MILESTONE_50" };
      task.traits.push(trait50);
      task.traits.forEach(function (t) {
        if (t.tier !== "CURIO" && t !== trait50) t.level += 1;
      });
      result.newTrait = trait50;
    }

    var curio = maybeRollCurio(task.traits);
    if (curio) {
      task.traits.push(curio);
      result.curio = curio;
    }

    applyQuality(task);
    return result;
  }

  window.Rolls = {
    weightedTier: weightedTier,
    calcQualityTier: calcQualityTier,
    applyQuality: applyQuality,
    completeEpic: completeEpic,
    forgeLegacy: forgeLegacy
  };
})();
