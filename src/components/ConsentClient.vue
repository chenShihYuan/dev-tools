<script setup lang="ts">
import { ref } from "vue";
import { validateConsent, generateConsent } from "@/tools/consent";

// 自動帶入當前民國年月 (YYYYMM → 民國YYYMM，取後5碼)
const now = new Date();
const rocYear = now.getFullYear() - 1911;
const month = String(now.getMonth() + 1).padStart(2, "0");
const prefix = ref(`${rocYear}${month}`);
const inputCode = ref("");
const msg = ref("");
const count = ref(3);
const results = ref<string[]>([]);

function onValidate() {
  msg.value = validateConsent(inputCode.value)
    ? "✅ 格式正確"
    : "❌ 格式錯誤";
}

function onGenerate() {
  results.value = [];
  for (let i = 1; i <= count.value; i++) {
    results.value.push(generateConsent(prefix.value, i));
  }
}
</script>

<template>
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">同意書編號 產生 / 驗證</h2>
    <p class="text-sm text-neutral-500">
      規則：編號共 12 碼，前 5 碼為民國年月 + 類別代碼 (A/B/C/D)，後 6 碼為流水號。
    </p>

    <!-- 驗證 -->
    <div>
      <input v-model="inputCode" placeholder="輸入同意書編號" class="border p-1" />
      <button @click="onValidate" class="ml-2 border px-2">驗證</button>
      <p>{{ msg }}</p>
    </div>

    <!-- 產生 -->
    <div>
      <input v-model="prefix" placeholder="民國年月 (5碼)" class="border p-1" />
      <input v-model.number="count" type="number" min="1" class="border p-1 w-20 ml-2" />
      <button @click="onGenerate" class="ml-2 border px-2">產生</button>

      <ul>
        <li v-for="code in results" :key="code">{{ code }}</li>
      </ul>
    </div>
  </div>
</template>