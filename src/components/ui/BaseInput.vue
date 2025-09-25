<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BaseInput',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    type: { type: String, default: 'text' },
  },
  emits: {
    'update:modelValue': (value: string) => true,
  },
  setup(props, { emit }) {
    function onInput(e: Event) {
      emit('update:modelValue', (e.target as HTMLInputElement).value);
    }
    return { props, onInput };
  },
});
</script>

<template>
  <input
    :type="props.type"
    :placeholder="props.placeholder"
    :value="props.modelValue"
    @input="onInput"
    class="h-9 w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white px-3 text-sm
           placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black
           dark:bg-neutral-900"
  />
</template>