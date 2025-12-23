<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { formatJSON, minifyJSON, tryParse } from "@/tools/json";
import JsonTree from "@/components/JsonTree.vue";

// ---- 快速捷徑：泛用工具 ----
function isJsonLikeString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const t = v.trim();
  return t.length > 1 && /^[{\[]/.test(t);
}
function tryParseJsonLoose(s: string): unknown | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
function entriesOf(val: any): Array<[string | number, any]> {
  if (typeof val === "string" && isJsonLikeString(val)) {
    const parsed = tryParseJsonLoose(val);
    if (parsed && typeof parsed === "object") {
      val = parsed;
    }
  }
  if (Array.isArray(val)) return val.map((child, i) => [i, child]);
  if (val && typeof val === "object") return Object.entries(val);
  return [];
}

const input = ref("");
const output = ref("");
const msg = ref("");
const inputRows = ref(8);

const fileName = ref("");

// 輸出框自動高度（不要垂直 scrollbar）
const outputEl = ref<HTMLTextAreaElement | null>(null);
function resizeOutput() {
  const el = outputEl.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
// 當輸出內容變動時自動調整高度
watch(output, () => nextTick(resizeOutput), { immediate: true });

// ---- 快速捷徑：遞迴探索參數 ----
const quickMinDepth = ref(2); // 不列第一層（=1）
const quickMaxDepth = ref(4); // 預設抓到第 4 層，可調
const QUICK_MAX_PATHS = 20; // 最多顯示幾個捷徑，避免爆版
const QUICK_MAX_CHILDREN = 24; // 每層最多掃幾個子鍵，避免超大物件
const QUICK_MAX_NODES = 2000; // 遍歷節點上限，避免卡住

// 快速索引 / 路徑跳轉
// 當路徑無效時暫時隱藏樹與清空輸出
const showTree = ref(true);

// Drag & Drop / 檔案選擇
const isDragging = ref(false);
function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return;
  const file = files[0];
  fileName.value = file.name;
  // 僅接受 JSON / 純文字
  const okTypes = ["application/json", "text/plain", ""];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowByExt = ext === "json" || ext === "txt";
  if (!okTypes.includes(file.type) && !allowByExt) {
    msg.value = "⚠️ 僅支援 .json 或 .txt 檔";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    input.value = String(reader.result ?? "");
    // 其餘動作（解析、縮高）交給現有的 watch(input, ...)
  };
  reader.onerror = () => {
    msg.value = "⚠️ 檔案讀取失敗";
  };
  reader.readAsText(file, "utf-8");
}
function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  handleFiles(e.dataTransfer?.files ?? null);
}
function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}
function onDragLeave(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
}
function onPick(e: Event) {
  const el = e.target as HTMLInputElement;
  handleFiles(el.files);
  // 重置 input 以便可連續選同一檔
  el.value = "";
}

// 解析為物件供樹狀用
const parsed = computed(() => {
  const r = tryParse(input.value);
  return r.ok ? (r.value as unknown) : null;
});

const quickPaths = computed<(string | number)[][]>(() => {
  const out: (string | number)[][] = [];
  const root = parsed.value as any;
  if (!root || typeof root !== "object") return out;

  const seen = new Set<string>();
  let visited = 0;

  const push = (p: (string | number)[]) => {
    if (p.length < quickMinDepth.value || p.length > quickMaxDepth.value)
      return;
    const key = p.join(".");
    if (!seen.has(key) && out.length < QUICK_MAX_PATHS) {
      seen.add(key);
      out.push(p);
    }
  };

  function isStructured(val: any): boolean {
    if (val == null) return false;
    if (Array.isArray(val)) return true;
    if (typeof val === "object") return true;
    if (typeof val === "string" && isJsonLikeString(val)) return true;
    return false;
  }

  function walk(val: any, path: (string | number)[]) {
    if (visited++ > QUICK_MAX_NODES) return;
    // 只要是結構型（物件/陣列/JSON 字串），且在深度範圍內，就推為捷徑
    if (isStructured(val)) push(path);

    // 取子節點（若是 JSON 字串會先 parse 成物件/陣列）
    const kids = entriesOf(val).slice(0, QUICK_MAX_CHILDREN);
    // 超過 quickMaxDepth 就不再往下
    if (path.length >= quickMaxDepth.value) return;

    for (const [k, child] of kids) {
      walk(child, [...path, k]);
      if (out.length >= QUICK_MAX_PATHS) break;
      if (visited > QUICK_MAX_NODES) break;
    }
  }

  // 從 root 的第一層鍵開始（故第一層 path 長度=1，不會被 push；符合不列第一層）
  const lv1 = Object.entries(root).slice(0, QUICK_MAX_CHILDREN);
  for (const [k1, v1] of lv1) {
    walk(v1, [k1]);
    if (out.length >= QUICK_MAX_PATHS) break;
  }

  return out;
});

function incQuickDepth() {
  quickMaxDepth.value = Math.min(6, quickMaxDepth.value + 1);
}
function decQuickDepth() {
  quickMaxDepth.value = Math.max(2, quickMaxDepth.value - 1);
}

function traverseByPath(
  obj: any,
  path: (string | number)[]
): { found: boolean; value?: unknown } {
  let cur = obj;
  for (const seg of path) {
    if (cur == null) return { found: false };
    // 若為 JSON 字串，嘗試 parse
    if (typeof cur === "string") {
      const t = cur.trim();
      if (t.length > 1 && /^[{\[]/.test(t)) {
        try {
          cur = JSON.parse(cur);
        } catch {
          /* ignore */
        }
      }
    }
    if (Array.isArray(cur)) {
      if (typeof seg === "number" && seg >= 0 && seg < cur.length) {
        cur = cur[seg];
      } else {
        return { found: false };
      }
    } else if (cur && typeof cur === "object") {
      const has = Object.prototype.hasOwnProperty.call(
        cur as object,
        seg as any
      );
      if (has) {
        cur = (cur as any)[seg as any];
      } else {
        return { found: false };
      }
    } else {
      return { found: false };
    }
  }
  return { found: true, value: cur };
}
function jumpTo(path: (string | number)[]) {
  // 僅在路徑有效時才設定
  const root = parsed.value;
  if (!root) return;
  const r = traverseByPath(root, path);
  if (!r.found) {
    msg.value = "⚠️ 找不到該路徑";
    // 不要隱藏樹，也不要清空輸出與目前焦點
    focusPath.value = [];
    output.value = "";
    showTree.value = true;
    return;
  }
  // 有效：顯示樹並把值寫到輸出框（即使是 null 也顯示 "null"）
  focusPath.value = path.slice();
  showTree.value = true;
  msg.value = "";
  output.value = toDisplay(r.value, 2);
}

// 控制樹：展開全部 / 收合全部 / 自動展開單一路徑
type TreeAction = "none" | "expandAll" | "collapseAll" | "autoSinglePath";
const treeCtrl = ref<{ action: TreeAction; nonce: number }>({
  action: "none",
  nonce: 0,
});
function triggerTree(action: TreeAction) {
  treeCtrl.value = { action, nonce: treeCtrl.value.nonce + 1 };
}
const onExpandAll = () => triggerTree("expandAll");
const onCollapseAll = () => triggerTree("collapseAll");
const onAutoSingle = () => triggerTree("autoSinglePath");

// 聚焦路徑（麵包屑）
const focusPath = ref<(string | number)[]>([]);
const focusValue = computed(() => {
  if (!parsed.value) return null;
  let cur: any = parsed.value;

  for (const seg of focusPath.value) {
    if (cur == null) return null;

    // 若當前層是「字串包 JSON」，先嘗試 parse 成物件/陣列再往下取 key
    if (typeof cur === "string") {
      const t = cur.trim();
      if (t.length > 1 && /^[{\[]/.test(t)) {
        try {
          cur = JSON.parse(cur);
        } catch {
          /* parse 失敗就維持原樣 */
        }
      }
    }

    // 取下一層
    if (cur != null && (typeof cur === "object" || Array.isArray(cur))) {
      cur = (cur as any)[seg as any];
    } else {
      return null;
    }
  }

  // 末端若仍是 JSON 字串，直接回傳原值（由視圖/輸出框決定是否格式化顯示）
  return cur ?? null;
});
// 標記是否有選到層級
const hasFocus = computed(() => focusPath.value.length > 0);

// 選到 null 也照實顯示
watch(
  [focusValue, hasFocus, parsed],
  ([val, has, root]) => {
    const src = has ? val : root; // 有選層級就顯示該層（即使是 null）；否則顯示根層
    output.value = toDisplay(src, 2);
  },
  { immediate: true }
);

function onFocus(path: (string | number)[]) {
  focusPath.value = path;
  showTree.value = true;
  msg.value = "";
}
function resetFocusTo(pathIndex: number) {
  focusPath.value = focusPath.value.slice(0, pathIndex + 1);
}
function clearFocus() {
  focusPath.value = [];
}
// 將任意值轉為顯示字串（字串若像 JSON 會先 parse 再格式化）
function toDisplay(val: unknown, space = 2): string {
  try {
    if (typeof val === "string") {
      const t = val.trim();
      if (t.length > 1 && /^[{\[]/.test(t)) {
        try {
          return JSON.stringify(JSON.parse(val), null, space);
        } catch {}
      }
      return val;
    }
    return JSON.stringify(val, null, space);
  } catch {
    return String(val ?? "");
  }
}
// 動作：美化/壓縮/複製
function parseFromOutput(): unknown | null {
  const s = output.value.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

const onFormat = () => {
  const obj = parseFromOutput();
  if (obj !== null) {
    output.value = JSON.stringify(obj, null, 2);
    msg.value = "✅ 已格式化輸出框內容";
  } else {
    msg.value = "⚠️ 輸出框不是有效 JSON，無法格式化";
  }
};

const onMinify = () => {
  const obj = parseFromOutput();
  if (obj !== null) {
    output.value = JSON.stringify(obj);
    msg.value = "✅ 已壓縮輸出框內容";
  } else {
    msg.value = "⚠️ 輸出框不是有效 JSON，無法壓縮";
  }
};
const onCopy = async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    msg.value = "📋 已複製";
  } catch {
    msg.value = "⚠️ 複製失敗（瀏覽器限制）";
  }
};

// 監聽輸入：自動解析，成功則美化到輸出並縮小輸入框高度
watch(
  input,
  (val) => {
    const t = val.trim();
    focusPath.value = []; // 換一份 JSON 時重置目前位置到 root
    if (!t) {
      msg.value = "";
      output.value = "";
      inputRows.value = 8; // 清空就恢復較高
      fileName.value = ""; // 清空時也清掉檔名
      showTree.value = true;
      return;
    }
    const r = tryParse(val);
    if (r.ok) {
      msg.value = "✅ 解析成功";
      output.value = formatJSON(val); // 直接針對原字串格式化
      inputRows.value = 2; // 成功 -> 縮小輸入框高度
    } else {
      msg.value = `❌ ${r.error}`;
      inputRows.value = 8; // 失敗 -> 維持較高，方便修正
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- 左側主要內容 -->
    <div class="space-y-6">
      <!-- 輸入/操作區（支援拖拉檔案 / 點選檔案） -->
      <div
        class="space-y-3 rounded-2xl border border-dashed px-3 py-3"
        :class="
          isDragging
            ? 'border-blue-400 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-900/20'
            : 'border-neutral-300 dark:border-neutral-700'
        "
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div class="text-neutral-600 dark:text-neutral-300">
            拖拉 <span class="font-medium">.json</span> 或
            <span class="font-medium">.txt</span> 檔到這裡，或直接在下方貼上
          </div>
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept=".json,.txt,application/json,text/plain"
              class="hidden"
              @change="onPick"
            />
            <span
              class="h-8 px-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 inline-flex items-center"
              >選擇檔案</span
            >
          </label>
        </div>
        <div
          v-if="fileName"
          class="text-xs text-neutral-500 dark:text-neutral-400 truncate"
        >
          📄 檔案：<span class="font-medium">{{ fileName }}</span>
        </div>

        <textarea
          v-model="input"
          :rows="inputRows"
          placeholder="貼上 JSON"
          class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono"
        />
      </div>

      <!-- 樹狀檢視 + 麵包屑 -->
      <div v-if="parsed && showTree" class="space-y-3">
        <!-- 快速索引與路徑跳轉 -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-neutral-500">捷徑深度：</span>
            <button
              class="h-7 px-2 rounded-2xl border border-neutral-300 dark:border-neutral-700"
              @click="decQuickDepth"
            >
              −
            </button>
            <span class="px-2">{{ quickMinDepth }} ~ {{ quickMaxDepth }}</span>
            <button
              class="h-7 px-2 rounded-2xl border border-neutral-300 dark:border-neutral-700"
              @click="incQuickDepth"
            >
              ＋
            </button>
            <span class="text-neutral-400">（第一層不列出）</span>
          </div>
          <!-- <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-neutral-500">樹操作：</span>
            <button class="h-8 px-3 rounded-2xl border border-neutral-300 dark:border-neutral-700" @click="onExpandAll">展開全部</button>
            <button class="h-8 px-3 rounded-2xl border border-neutral-300 dark:border-neutral-700" @click="onCollapseAll">收合全部</button>
            <button class="h-8 px-3 rounded-2xl border border-neutral-300 dark:border-neutral-700" @click="onAutoSingle">自動展開單一路徑</button>
          </div> -->
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-neutral-500">快速到：</span>
            <template v-if="quickPaths.length">
              <button
                v-for="(p, i) in quickPaths"
                :key="i"
                class="px-3 h-8 rounded-2xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                @click="jumpTo(p)"
                :title="Array.isArray(p) ? p.join('.') : String(p)"
              >
                {{ Array.isArray(p) ? p.join(".") : String(p) }}
              </button>
            </template>
            <span v-else class="text-neutral-400">（無可用索引）</span>
          </div>
        </div>
        <!-- 麵包屑：可點擊回到任一層 -->
        <div class="text-sm">
          <span class="mr-2 text-neutral-500">目前位置：</span>
          <button
            class="underline underline-offset-2"
            v-if="focusPath.length"
            @click="clearFocus"
            title="回到根層"
          >
            root
          </button>
          <span v-else class="font-medium">root</span>

          <template v-for="(seg, idx) in focusPath" :key="idx">
            <span class="mx-1 text-neutral-400">/</span>
            <button
              class="underline underline-offset-2"
              @click="resetFocusTo(idx)"
            >
              {{ String(seg) }}
            </button>
          </template>
        </div>

        <!-- 樹：當前焦點的值（默認為整棵） -->
        <div
          class="rounded-2xl border border-neutral-300 dark:border-neutral-700 p-3"
        >
          <JsonTree
            :key="input"
            :value="hasFocus ? focusValue : parsed"
            :path="focusPath"
            :ctrl="treeCtrl"
            @focus="onFocus"
          />
        </div>
      </div>

      <div v-else class="text-sm text-neutral-500">
        貼上有效 JSON 後，會顯示可收合的樹狀檢視與可點麵包屑。
      </div>
    </div>

    <!-- 右側輸出框區塊 -->
    <div class="space-y-3 sticky top-4 self-start">
      <div class="flex flex-wrap gap-2">
        <button
          class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700"
          @click="onFormat"
        >
          格式化
        </button>
        <button
          class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700"
          @click="onMinify"
        >
          壓縮
        </button>
        <button
          class="h-9 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700"
          @click="onCopy"
        >
          複製輸出
        </button>
      </div>

      <p class="text-sm text-neutral-600 dark:text-neutral-300">
        {{ msg }}
      </p>

      <textarea
        ref="outputEl"
        v-model="output"
        :rows="1"
        readonly
        placeholder="顯示目前聚焦層內容（預設格式化）"
        class="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-mono"
        style="overflow: hidden; resize: none"
      />
    </div>
  </div>
</template>
