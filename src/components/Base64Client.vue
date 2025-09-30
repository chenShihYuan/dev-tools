<script setup lang="ts">
import { ref, watch } from "vue";
import { encodeBase64, decodeBase64 } from "@/tools/base64";

const input = ref("");
const output = ref("");
const error = ref("");
const copiedMsg = ref("");
function copyToClipboard(text: string, label: string) {
  const val = typeof text === 'string' ? text : String(text ?? '');
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    copiedMsg.value = `${label} 已複製`;
    setTimeout(() => (copiedMsg.value = ''), 1500);
  }).catch(() => {});
}

// 雙向同步：input 改動 → 更新 output
watch(input, (val) => {
  error.value = "";
  output.value = encodeBase64(val);
});

// output 改動 → 更新 input；若 Base64 無效，清空對側並顯示錯誤
watch(output, (val) => {
  // 每次重新輸入都先清空錯誤與左側
  error.value = "";
  input.value = "";
  if (!val) return;
  const decoded = decodeBase64(val);
  if (decoded.startsWith("⚠️")) {
    error.value = decoded; // 顯示錯誤訊息
    return;
  }
  input.value = decoded;
});
</script>

<template>
  <!-- 原始字串 -->
  <div class="space-y-1">
    <div class="flex justify-between items-center">
      <span class="font-medium">原始字串</span>
      <button type="button" class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
        @click="copyToClipboard(input, '原始字串')">複製</button>
    </div>
    <textarea v-model="input" rows="6" placeholder="輸入原始字串"
      class="w-full rounded-2xl border px-3 py-2 font-mono" />
  </div>

  <!-- Base64 -->
  <div class="space-y-1">
    <div class="flex justify-between items-center">
      <span class="font-medium">Base64</span>
      <button type="button" class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
        @click="copyToClipboard(output, 'Base64')">複製</button>
    </div>
    <textarea v-model="output" rows="6" placeholder="輸入或顯示 Base64"
      :class="['w-full rounded-2xl border px-3 py-2 font-mono', error ? 'border-red-500 focus-visible:outline-red-500' : 'border-neutral-300 dark:border-neutral-700']" />
  </div>

  <!-- 訊息顯示 -->
  <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  <p v-if="copiedMsg" class="text-sm text-green-600">{{ copiedMsg }}</p>
</template>