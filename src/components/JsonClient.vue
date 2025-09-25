<script setup lang="ts">
import { ref } from 'vue';
import { formatJSON, minifyJSON } from '@/tools/json';

const input = ref('');
const output = ref('');

const onFormat = () => {
  output.value = formatJSON(input.value);
};

const onMinify = () => {
  output.value = minifyJSON(input.value);
};
</script>

<template>
  <div class="space-y-3">
    <textarea
      v-model="input"
      rows="6"
      placeholder="貼上 JSON"
      class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2"
    />
    <div class="flex gap-2">
      <button
        class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700"
        @click="onFormat"
      >
        美化
      </button>
      <button
        class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700"
        @click="onMinify"
      >
        壓縮
      </button>
    </div>
    <textarea
      v-model="output"
      rows="6"
      readonly
      class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono"
    />
  </div>
</template>