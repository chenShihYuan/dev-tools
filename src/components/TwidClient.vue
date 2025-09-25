<script setup lang="ts">
import { ref } from 'vue';
import { generateTWID, validateTWID } from '@/tools/twid';

// 狀態
const gender = ref<'1' | '2'>('1');
const count = ref(3);
const id = ref('');
const results = ref<string[]>([]);
const msg = ref('');

// 事件
const onGen = () => {
  const g = gender.value === '1' ? 1 : 2;
  const list: string[] = [];
  for (let i = 0; i < count.value; i++) {
    list.push(generateTWID({ gender: g }));
  }
  results.value = list;
};

const onChk = () => {
  const v = id.value.trim().toUpperCase();
  msg.value = validateTWID(v) ? '✅ 檢核通過' : '❌ 檢核失敗';
};
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <label for="gender" class="text-sm">性別：</label>
      <select
        id="gender"
        v-model="gender"
        class="h-9 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-2"
      >
        <option value="1">男(1)</option>
        <option value="2">女(2)</option>
      </select>
      <input
        type="number"
        min="1"
        v-model.number="count"
        class="w-16 h-9 rounded-2xl border border-neutral-300 dark:border-neutral-700 px-2"
        title="產生筆數"
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
        v-model="id"
        placeholder="輸入身分證字號"
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