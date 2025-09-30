<script setup lang="ts">
import { ref, computed } from "vue";
import { toISOOffset, fromISOOffset } from "@/tools/timestamp";

const TZ = 8; // Asia/Taipei (+8)

const timestamp = ref("");
const copiedMsg = ref('');
const iso = computed({
  get() {
    const num = Number.parseInt((timestamp.value ?? '').toString().trim(), 10);
    if (!Number.isFinite(num)) return '';
    return toISOOffset(num, TZ);
  },
  set(val: string) {
    if (!val) {
      timestamp.value = '';
      return;
    }
    const ts = fromISOOffset(val, TZ);
    if (Number.isFinite(ts)) {
      timestamp.value = String(ts);
    }
  }
});

function setNow() {
  timestamp.value = String(Math.floor(Date.now() / 1000));
}

function copyToClipboard(text: string, label: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copiedMsg.value = `${label} 已複製`;
    setTimeout(() => (copiedMsg.value = ''), 1500);
  }).catch(err => console.error('Copy failed', err));
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex">
      <input v-model="timestamp" maxlength="13" type="text" placeholder="輸入 Unix Timestamp"
        class="w-full rounded-2xl border px-3 py-2 font-mono" />
      <button type="button" @click="copyToClipboard(timestamp, 'Unix Timestamp')"
        class="ml-2 px-3 py-2 rounded-2xl border">複製</button>
    </div>
    <div class="flex">
      <input v-model="iso" maxlength="19" type="text" placeholder="輸入 ISO 8601 日期"
        class="w-full rounded-2xl border px-3 py-2 font-mono" />
      <button type="button" @click="copyToClipboard(iso, 'ISO 8601')"
        class="ml-2 px-3 py-2 rounded-2xl border">複製</button>
    </div>
    <button type="button" @click="setNow"
        class="px-4 py-2 rounded-2xl border">帶入目前時間</button>
    <p v-if="copiedMsg" class="text-sm text-green-600">{{ copiedMsg }}</p>
  </div>
</template>