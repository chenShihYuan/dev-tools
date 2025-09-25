<script setup lang="ts">
import { ref, computed } from "vue";
import BaseInput from "./ui/BaseInput.vue";
import BaseSeparator from "./ui/BaseSeparator.vue";
import ToolCard from "./ToolCard.vue";

type Tool = { id:string; title:string; description:string; href:string; tags:string[] };
const ALL_TOOLS: Tool[] = [
  { id: "twid", title: "身分證字號 產生/驗證", description: "臺灣身分證檢核、隨機產生（可選性別/首字）", href: "twid", tags: ["id","taiwan","generator","validator"] },
  { id: "ubn",  title: "統一編號 產生/驗證", description: "8 碼統編檢核、批次產生", href: "ubn", tags: ["ubn","tax","generator","validator"] },
  { id: "json", title: "JSON 工具箱", description: "格式化、壓縮、驗證、Flatten", href: "json", tags: ["json","format","minify","flatten"] }
];

const q = ref("");
const list = computed(() => {
  const term = q.value.trim().toLowerCase();
  if (!term) return ALL_TOOLS;
  return ALL_TOOLS.filter(t =>
    t.title.toLowerCase().includes(term) ||
    t.description.toLowerCase().includes(term) ||
    t.tags.some(tag => tag.includes(term))
  );
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-3">
      <BaseInput v-model="q" placeholder="搜尋工具（關鍵字、標籤…）" />
    </div>
    <BaseSeparator />
    <div class="grid sm:grid-cols-2 gap-4">
      <ToolCard v-for="t in list" :key="t.id" :title="t.title" :description="t.description" :href="t.href" />
      <p v-if="list.length===0" class="text-sm text-neutral-500">找不到符合「{{ q }}」的工具。</p>
    </div>
  </div>
</template>