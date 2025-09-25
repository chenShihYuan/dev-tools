<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatJSON, minifyJSON, tryParse } from '@/tools/json';
import JsonTree from '@/components/JsonTree.vue';

const input = ref('');
const output = ref('');
const msg = ref('');

// 解析為物件供樹狀用
const parsed = computed(() => {
  const r = tryParse(input.value);
  return r.ok ? (r.value as unknown) : null;
});

// 聚焦路徑（麵包屑）
const focusPath = ref<(string | number)[]>([]);
const focusValue = computed(() => {
  if (!parsed.value) return null;
  let cur: any = parsed.value;
  for (const seg of focusPath.value) {
    if (cur == null) return null;
    cur = cur[seg as any];
  }
  return cur;
});
function onFocus(path: (string | number)[]) {
  focusPath.value = path;
}
function resetFocusTo(pathIndex: number) {
  focusPath.value = focusPath.value.slice(0, pathIndex + 1);
}
function clearFocus() {
  focusPath.value = [];
}

// 動作：美化/壓縮/複製
const onFormat = () => {
  const res = tryParse(input.value);
  msg.value = res.ok ? '✅ 解析成功' : `❌ ${res.error}`;
  output.value = formatJSON(input.value);
  // 同步樹資料
};
const onMinify = () => {
  const res = tryParse(input.value);
  msg.value = res.ok ? '✅ 解析成功' : `❌ ${res.error}`;
  output.value = minifyJSON(input.value);
};
const onCopy = async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    msg.value = '📋 已複製';
  } catch {
    msg.value = '⚠️ 複製失敗（瀏覽器限制）';
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- 輸入/操作區 -->
    <div class="space-y-3">
      <textarea
        v-model="input"
        rows="8"
        placeholder="貼上 JSON"
        class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono"
      />
      <div class="flex flex-wrap gap-2">
        <button class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700" @click="onFormat">美化</button>
        <button class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700" @click="onMinify">壓縮</button>
        <button class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700" @click="onCopy">複製輸出</button>
      </div>
      <p class="text-sm text-neutral-600 dark:text-neutral-300">{{ msg }}</p>
    </div>

    <!-- 樹狀檢視 + 麵包屑 -->
    <div v-if="parsed" class="space-y-3">
      <!-- 麵包屑：可點擊回到任一層 -->
      <div class="text-sm">
        <span class="mr-2 text-neutral-500">目前位置：</span>
        <button
          class="underline underline-offset-2"
          v-if="focusPath.length"
          @click="clearFocus"
          title="回到根層"
        >root</button>
        <span v-else class="font-medium">root</span>

        <template v-for="(seg, idx) in focusPath" :key="idx">
          <span class="mx-1 text-neutral-400">/</span>
          <button class="underline underline-offset-2" @click="resetFocusTo(idx)">{{ String(seg) }}</button>
        </template>
      </div>

      <!-- 樹：當前焦點的值（默認為整棵） -->
      <div class="rounded-2xl border border-neutral-300 dark:border-neutral-700 p-3">
        <JsonTree :value="focusValue ?? parsed" @focus="onFocus" />
      </div>
    </div>

    <div v-else class="text-sm text-neutral-500">
      貼上有效 JSON 後，會顯示可收合的樹狀檢視與可點麵包屑。
    </div>

    <!-- 美化輸出（原本的框框） -->
    <div>
      <textarea
        v-model="output"
        rows="8"
        readonly
        placeholder="輸出在此顯示"
        class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono"
      />
    </div>
  </div>
</template>