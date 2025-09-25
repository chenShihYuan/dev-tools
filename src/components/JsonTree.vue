<script setup lang="ts">
import { computed, reactive } from 'vue';

type JSONObject = Record<string, unknown>;
type JSONValue = JSONObject | unknown[] | string | number | boolean | null;

const props = defineProps<{
  value: JSONValue;
  path?: (string | number)[];
}>();
const emit = defineEmits<{
  (e: 'focus', path: (string | number)[]): void
}>();

const state = reactive<{ open: Record<string, boolean> }>({ open: {} });

const entries = computed<ReadonlyArray<readonly [string | number, JSONValue]>>(() => {
  if (Array.isArray(props.value)) {
    return props.value.map((v, i) => [i as number, v as JSONValue] as const);
  }
  if (props.value && typeof props.value === 'object') {
    return Object.entries(props.value as JSONObject).map(([k, val]) => [k, val as JSONValue] as const);
  }
  return [] as readonly (readonly [string | number, JSONValue])[];
});

function keyPath(key: string | number) {
  return [...(props.path ?? []), key];
}
function nodeKey(p: (string | number)[]) {
  return p.join('/');
}
function toggle(p: (string | number)[]) {
  const k = nodeKey(p);
  state.open[k] = !state.open[k];
}
function typeOf(v: JSONValue) {
  if (Array.isArray(v)) return `Array(${v.length})`;
  if (v === null) return 'null';
  return typeof v;
}
</script>

<template>
  <ul class="space-y-1">
    <template v-for="[k, v] in entries" :key="nodeKey(keyPath(k))">
      <li class="font-mono">
        <template v-if="v && typeof v === 'object'">
          <button
            class="mr-2 w-6 inline-flex items-center justify-center rounded border border-neutral-300 dark:border-neutral-700"
            @click="toggle(keyPath(k))"
            :title="state.open[nodeKey(keyPath(k))] ? '收合' : '展開'"
          >
            {{ state.open[nodeKey(keyPath(k))] ? '−' : '+' }}
          </button>

          <span
            class="cursor-pointer underline-offset-2 hover:underline"
            @click="emit('focus', keyPath(k))"
            :title="'聚焦到 ' + [...(props.path ?? []), k].join('.')"
          >
            {{ String(k) }}
          </span>
          <span class="text-neutral-500"> — {{ typeOf(v) }}</span>

          <div v-if="state.open[nodeKey(keyPath(k))]" class="pl-5 mt-1 border-l border-neutral-200 dark:border-neutral-800">
            <JsonTree :value="v" :path="keyPath(k)" @focus="emit('focus', $event)" />
          </div>
        </template>

        <template v-else>
          <span
            class="cursor-pointer underline-offset-2 hover:underline text-neutral-500"
            @click="emit('focus', keyPath(k))"
            :title="'聚焦到 ' + [...(props.path ?? []), k].join('.')"
          >
            {{ String(k) }}:
          </span>
          <span class="ml-2 select-text">
            {{ String(v) }}
          </span>
        </template>
      </li>
    </template>
  </ul>
</template>