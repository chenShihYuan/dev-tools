<script setup lang="ts">
import { ref, nextTick } from "vue";
import { diffLines } from "diff";

const left = ref("");
const right = ref("");
const resultHtml = ref("");

const leftBox = ref<HTMLTextAreaElement | null>(null);
const rightBox = ref<HTMLTextAreaElement | null>(null);
const resultBox = ref<HTMLDivElement | null>(null);
const syncing = ref(false);

function runDiff() {
  const parts = diffLines(left.value ?? "", right.value ?? "");
  resultHtml.value = parts
    .map((p) => {
      const cls = p.added
        ? "bg-green-200/70 text-green-900"
        : p.removed
        ? "bg-red-200/70 text-red-900"
        : "";
      const esc = (s: string) =>
        s.replace(/[&<>]/g, (ch) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch] as string)
        );
      return `<span class=\"${cls}\">${esc(p.value)}</span>`;
    })
    .join("");
  nextTick(() => syncScroll("left"));
}

function clearAll() {
  left.value = "";
  right.value = "";
  resultHtml.value = "";
}

function syncScroll(from: "left" | "right" | "result") {
  const l = leftBox.value;
  const r = rightBox.value;
  const res = resultBox.value;
  if (!l || !r || !res) return;
  if (syncing.value) return;

  syncing.value = true;
  try {
    if (from === "left") {
      if (r.scrollTop !== l.scrollTop) r.scrollTop = l.scrollTop;
      if (res.scrollTop !== l.scrollTop) res.scrollTop = l.scrollTop;
    } else if (from === "right") {
      if (l.scrollTop !== r.scrollTop) l.scrollTop = r.scrollTop;
      if (res.scrollTop !== r.scrollTop) res.scrollTop = r.scrollTop;
    } else {
      if (l.scrollTop !== res.scrollTop) l.scrollTop = res.scrollTop;
      if (r.scrollTop !== res.scrollTop) r.scrollTop = res.scrollTop;
    }
  } finally {
    syncing.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Diff 工具</h2>
    <p class="text-sm text-neutral-500">貼上兩段文字，比對差異（新增綠底、刪除紅底）。</p>

    <div class="flex flex-col md:flex-row gap-3">
      <textarea
        ref="leftBox"
        v-model="left"
        class="md:w-1/2 w-full h-80 rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono overflow-auto"
        placeholder="原始內容（Left）"
        @scroll="syncScroll('left')"
      />
      <textarea
        ref="rightBox"
        v-model="right"
        class="md:w-1/2 w-full h-80 rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono overflow-auto"
        placeholder="修改後內容（Right）"
        @scroll="syncScroll('right')"
      />
    </div>

    <div class="flex items-center gap-2">
      <button class="h-9 px-4 rounded-2xl border" @click="runDiff">比對</button>
      <button class="h-9 px-4 rounded-2xl border" @click="clearAll">清空</button>
    </div>

    <div v-if="resultHtml" ref="resultBox" @scroll="syncScroll('result')" class="h-80 rounded-2xl border border-neutral-300 dark:border-neutral-700 p-3 font-mono whitespace-pre-wrap overflow-auto" v-html="resultHtml"></div>
  </div>
</template>
