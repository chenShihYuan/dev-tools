<script setup lang="ts">
import { reactive, computed, watch } from 'vue';

type JSONObject = Record<string, unknown>;
type JSONValue = JSONObject | unknown[] | string | number | boolean | null;

const props = defineProps<{
  value: JSONValue;
  path?: (string | number)[];
  ctrl?: { action: 'none' | 'expandAll' | 'collapseAll' | 'autoSinglePath'; nonce: number };
}>();
const emit = defineEmits<{
  (e: 'focus', path: (string | number)[]): void
}>();

const state = reactive<{ open: Record<string, boolean> }>({ open: {} });

function isJsonLikeString(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return t.length > 1 && (/^[\{\[]/.test(t));
}

function typeOf(v: JSONValue) {
  if (Array.isArray(v)) return `Array(${v.length})`;
  if (v === null) return 'null';
  return typeof v;
}

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

// 展示時：若 value 是 JSON 字串，先嘗試解析以供展開
const structured = computed<JSONValue>(() => {
  const v = props.value as JSONValue;
  if (isJsonLikeString(v)) {
    try { return JSON.parse(v as string) as JSONValue; } catch { /* ignore */ }
  }
  return v;
});

const entries = computed<ReadonlyArray<readonly [string | number, JSONValue]>>(() => {
  const val = structured.value;
  if (Array.isArray(val)) {
    return val.map((v, i) => [i as number, v as JSONValue] as const);
  }
  if (val && typeof val === 'object') {
    return Object.entries(val as JSONObject).map(([k, vv]) => [k, vv as JSONValue] as const);
  }
  return [] as readonly (readonly [string | number, JSONValue])[];
});

// 工具：走訪物件/陣列（含 JSON 字串解析）並對每個節點執行 callback
function forEachNode(val: JSONValue, basePath: (string | number)[], cb: (p: (string | number)[], v: JSONValue) => void) {
  cb(basePath, val);
  let cur = val as any;
  if (typeof cur === 'string') {
    const t = cur.trim();
    if (t.length > 1 && (/^[{\[]/.test(t))) {
      try { cur = JSON.parse(cur); } catch { /* ignore */ }
    }
  }
  if (Array.isArray(cur)) {
    cur.forEach((child, i) => forEachNode(child as JSONValue, [...basePath, i], cb));
  } else if (cur && typeof cur === 'object') {
    Object.entries(cur as JSONObject).forEach(([k, vv]) => forEachNode(vv as JSONValue, [...basePath, k], cb));
  }
}

function expandAll() {
  state.open = {};
  forEachNode(props.value as JSONValue, props.path ?? [], (p, v) => {
    // 只對包含子節點的節點設為展開
    let cur = v as any;
    if (typeof cur === 'string') {
      const t = cur.trim();
      if (t.length > 1 && (/^[{\[]/.test(t))) {
        try { cur = JSON.parse(cur); } catch { /* ignore */ }
      }
    }
    const hasChildren = (Array.isArray(cur) && cur.length > 0) || (cur && typeof cur === 'object' && Object.keys(cur).length > 0);
    if (hasChildren) state.open[nodeKey(p)] = true;
  });
}
function collapseAll() {
  state.open = {};
}
function autoExpandSinglePath() {
  state.open = {};
  // 從目前根一路展開，直到分歧
  let cur: any = props.value as any;
  let p: (string | number)[] = props.path ? [...props.path] : [];
  while (cur != null) {
    // 嘗試將 JSON 字串轉為物件/陣列
    if (typeof cur === 'string') {
      const t = cur.trim();
      if (t.length > 1 && (/^[{\[]/.test(t))) {
        try { cur = JSON.parse(cur); } catch { break; }
      } else {
        break;
      }
    }
    let children: Array<[string | number, any]> = [];
    if (Array.isArray(cur)) {
      if (cur.length === 1) children = [[0, cur[0]]];
      else break;
    } else if (cur && typeof cur === 'object') {
      const keys = Object.keys(cur);
      if (keys.length === 1) {
        const k = keys[0];
        children = [[k, (cur as any)[k]]];
      } else {
        break;
      }
    } else {
      break;
    }
    // 展開當前
    state.open[nodeKey(p)] = true;
    // 前進到唯一子節點
    const [nk, nv] = children[0];
    p = [...p, nk];
    cur = nv;
  }
}

// 監聽控制訊號
watch(
  () => props.ctrl?.nonce,
  () => {
    const action = props.ctrl?.action ?? 'none';
    if (action === 'expandAll') expandAll();
    else if (action === 'collapseAll') collapseAll();
    else if (action === 'autoSinglePath') autoExpandSinglePath();
  }
);
</script>

<template>
  <ul class="space-y-1">
    <template v-for="[k, v] in entries" :key="nodeKey(keyPath(k))">
      <li class="font-mono">
        <!-- 物件 / 陣列 / 可解析的 JSON 字串 -->
        <template v-if="(v && typeof v === 'object') || (typeof v === 'string' && v.length > 1 && /^\s*[{[]/.test(v))">
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

        <!-- 葉節點：只有 key 可點擊，value 為純文字 -->
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