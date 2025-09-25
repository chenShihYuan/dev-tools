<script setup lang="ts">
import { ref } from 'vue';
import { generateUBN, validateUBN, generateUBNs } from '@/tools/ubn';

const count = ref(3);
const input = ref('');
const results = ref<string[]>([]);
const msg = ref('');

const onGen = () => {
  results.value = generateUBNs(count.value);
};

const onChk = () => {
  const v = input.value.trim();
  msg.value = validateUBN(v) ? '✅ 檢核通過' : '❌ 檢核失敗';
};
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <label class="text-sm">產生筆數：</label>
      <input
        type="number"
        min="1"
        v-model.number="count"
        class="w-20 h-9 rounded-2xl border border-neutral-300 dark:border-neutral-700 px-2"
      />
      <button
        class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700"
        @click="onGen"
      >
        隨機產生
      </button>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="input"
        placeholder="輸入統一編號（8 碼）"
        class="flex-1 h-9 rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3"
      />
      <button
        class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700"
        @click="onChk"
      >
        檢查
      </button>
    </div>
    <p class="text-sm text-neutral-600 dark:text-neutral-300">{{ msg }}</p>

    <ul v-if="results.length" class="mt-2 space-y-1 text-sm">
      <li v-for="(r, idx) in results" :key="idx" class="font-mono">{{ r }}</li>
    </ul>
    <p v-if="results.length" class="text-sm text-neutral-600 dark:text-neutral-300">
      已產生 {{ results.length }} 筆（僅供測試）
    </p>
  </div>
</template>