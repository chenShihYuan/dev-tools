<script setup lang="ts">
defineProps<{ variant?: 'default'|'outline'|'ghost'; type?: 'button'|'submit' }>();
</script>

<template>
  <button
    :type="type ?? 'button'"
    class="inline-flex items-center justify-center rounded-2xl text-sm font-medium h-9 px-4 transition
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
           disabled:opacity-50 disabled:pointer-events-none"
    :class="{
      'bg-black text-white hover:opacity-90 dark:bg-white dark:text-black': (variant ?? 'default')==='default',
      'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800': variant==='outline',
      'hover:bg-neutral-100 dark:hover:bg-neutral-800': variant==='ghost'
    }"
  ><slot /></button>
</template>