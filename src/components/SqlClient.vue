<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { formatSQL, minifySQL, type SqlDialect } from "@/tools/sql";

const input = ref("");
const output = ref("");
const dialect = ref<SqlDialect>("sql");
const uppercase = ref(true);
const indent = ref<"2" | "4">("2");
const addWhere = ref(false);

// Action message state and helper
const actionMsg = ref("");
function flash(text: string) {
  actionMsg.value = text;
  setTimeout(() => (actionMsg.value = ""), 1500);
}

// Button click wrappers (避免打字觸發 watcher 時也冒訊息)
function onFormatClick() { onFormat(); flash("已格式化"); }
function onMinifyClick() { onMinify(); flash("已壓縮輸出"); }
function onCopyClick() { onCopy(); flash("已複製"); }
function onClearClick() { onClear(); flash("已清空"); }

const outEl = ref<HTMLTextAreaElement | null>(null);
function autosize() {
  const el = outEl.value; if (!el) return;
  el.style.height = "auto"; el.style.height = el.scrollHeight + "px";
}
watch(output, () => nextTick(autosize));

function onFormat() {
  const actualDialect = dialect.value === "tsql" ? "sql" : dialect.value;
  let formatted = formatSQL(input.value, {
    dialect: actualDialect,
    uppercase: uppercase.value,
    indentSize: indent.value === "2" ? 2 : 4,
  });

  if (addWhere.value) {
    // 偵測是否已存在 WHERE 1 = 1（容許空白與換行）
    const hasWhereOne = /WHERE\s+1\s*=\s*1\b/i.test(formatted);
    if (!hasWhereOne) {
      if (/WHERE\b/i.test(formatted)) {
        // 已經有 WHERE，但不是以 1=1 開頭 → 在第一個 WHERE 後面插入 "1=1 AND "
        formatted = formatted.replace(/WHERE\b([\s\r\n]*)/i, (_m, ws) => `WHERE${ws}1=1 AND `);
      } else {
        // 沒有 WHERE → 在 GROUP BY / ORDER BY / LIMIT / OFFSET / FETCH / FOR / 結尾 前插入
        const anchor = /(GROUP BY|ORDER BY|LIMIT|OFFSET|FETCH|FOR|$)/i;
        formatted = formatted.replace(anchor, (m) => `WHERE 1=1\n${m}`);
      }
      // 再跑一次格式化，套用關鍵字大小寫與縮排
      formatted = formatSQL(formatted, {
        dialect: actualDialect,
        uppercase: uppercase.value,
        indentSize: indent.value === "2" ? 2 : 4,
      });
    }
  }

  output.value = formatted;
}
function onMinify() {
  // 針對「輸出框」內容進行壓縮（你之前的規格）
  output.value = minifySQL(output.value || input.value);
}
function onCopy() {
  if (!output.value) return;
  navigator.clipboard.writeText(output.value).catch(() => {});
}
function onClear() {
  input.value = "";
  output.value = "";
}

// 小體驗：輸入變動即時預覽（可關掉這段就改成按鈕觸發）
watch([input, dialect, uppercase, indent, addWhere], () => {
  if (!input.value.trim()) { output.value = ""; return; }
  onFormat();
}, { immediate: true });
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">SQL 格式化</h2>
    <p class="text-sm text-neutral-500">支援方言：Standard / MySQL / PostgreSQL / SQLite / T-SQL。可格式化或壓縮，並一鍵複製。</p>

    <!-- 設定 -->
    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 p-3">
      <label class="text-sm">方言</label>
      <select v-model="dialect" class="rounded-xl border px-3 py-2">
        <option value="sql">Standard SQL</option>
        <option value="mysql">MySQL</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="sqlite">SQLite</option>
        <option value="tsql">T-SQL</option>
      </select>

      <label class="text-sm ml-2 flex items-center gap-2">
        <input type="checkbox" v-model="uppercase" class="h-4 w-4">
        關鍵字大寫
      </label>

      <label class="text-sm ml-2 flex items-center gap-2">
        <input type="checkbox" v-model="addWhere" class="h-4 w-4">
        自動加上 WHERE 1=1
      </label>

      <label class="text-sm ml-2">縮排</label>
      <select v-model="indent" class="rounded-xl border px-3 py-2">
        <option value="2">2 空白</option>
        <option value="4">4 空白</option>
      </select>

      <div class="ml-auto flex gap-2">
        <button class="h-9 px-4 rounded-2xl border" @click="onFormatClick">格式化</button>
        <button class="h-9 px-4 rounded-2xl border" @click="onMinifyClick">壓縮</button>
        <button class="h-9 px-4 rounded-2xl border" @click="onCopyClick">複製輸出</button>
        <button class="h-9 px-4 rounded-2xl border" @click="onClearClick">清空</button>
      </div>
      <span v-if="actionMsg" class="text-sm text-green-600 ml-3">{{ actionMsg }}</span>
    </div>

    <!-- 輸入 -->
    <div class="space-y-2">
      <label class="text-xs text-neutral-500">輸入 SQL</label>
      <textarea
        v-model="input"
        rows="5"
        placeholder="貼上你的 SQL，例如：select id,name from users where created_at >= '2025-01-01';"
        class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono"
      />
    </div>

    <!-- 輸出（自動撐高、無滾動條） -->
    <div class="space-y-2">
      <label class="text-xs text-neutral-500">格式化 / 壓縮結果</label>
      <textarea
        ref="outEl"
        v-model="output"
        rows="1"
        readonly
        placeholder="這裡會顯示格式化後的結果"
        class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono"
        style="overflow:hidden; resize:none;"
      />
    </div>
  </div>
</template>