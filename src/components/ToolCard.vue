<script setup lang="ts">
const props = defineProps<{ title:string; description:string; href:string }>();

// strip 前導斜線，再用 BASE_URL 組完整路徑
const path = props.href.startsWith('/') ? props.href.slice(1) : props.href;
const resolvedHref = import.meta.env.BASE_URL + path;
</script>

<template>
  <a :href="resolvedHref" class="block rounded-2xl border p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900">
    <h3 class="font-semibold">{{ props.title }}</h3>
    <p class="text-sm text-neutral-500 mt-1">{{ props.description }}</p>
  </a>
</template>