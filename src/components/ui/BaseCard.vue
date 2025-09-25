<template>
  <div class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm">
    <div v-if="$slots.header" class="p-4 pb-2"><slot name="header" /></div>
    <div class="p-4 pt-0"><slot /></div>
  </div>
</template>