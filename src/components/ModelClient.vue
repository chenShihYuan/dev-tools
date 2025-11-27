<!-- 📄 路徑：src/components/ModelClient.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { generateModel } from "../tools/model-generator";

const inputJson = ref("");
const className = ref("RootModel");
const lang = ref("dart");
const output = ref("");
const msg = ref("");

function tryParse(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function run() {
  const obj = tryParse(inputJson.value);
  if (!obj) {
    msg.value = "❌ JSON 格式錯誤";
    output.value = "";
    return;
  }
  output.value = generateModel(obj, { className: className.value, lang: lang.value });
  msg.value = "✅ 已產生 Model";
}

async function copyOut() {
  try {
    await navigator.clipboard.writeText(output.value);
    msg.value = "📋 已複製";
  } catch {
    msg.value = "⚠️ 複製失敗";
  }
}

function clearAll() {
  // inputJson.value = "";
  output.value = "";
  msg.value = "";
}
</script>

<template>
  <!-- <div class="space-y-4">
    <h2 class="text-lg font-semibold">Model 產生器（多語言）</h2>
    <div>
      <textarea v-model="inputJson" rows="8" placeholder="貼上 JSON" class="w-full rounded-xl border px-3 py-2 font-mono"></textarea>
    </div>

    <div class="flex flex-wrap gap-4 items-center">
      <div>
        <div class="text-sm mb-1">Class 名稱</div>
        <input v-model="className" class="rounded-xl border px-3 py-2" style="width: 200px" />
      </div>

      <div>
        <div class="text-sm mb-1">語言</div>
        <select v-model="lang" class="rounded-xl border px-3 py-2">
          <option value="dart">Dart</option>
          <option value="swift">Swift</option>
          <option value="kotlin">Kotlin</option>
          <option value="ts">TypeScript</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="python">Python</option>
          <option value="rust">Rust</option>
          <option value="php">PHP</option>
          <option value="java">Java</option>
        </select>
      </div>

      <button class="h-10 px-4 rounded-xl border" @click="run">產生 Model</button>
    </div>

    <p class="text-sm text-neutral-600">{{ msg }}</p>

    <div>
      <textarea v-model="output" readonly rows="12" class="w-full rounded-xl border px-3 py-2 font-mono"></textarea>
    </div>

    <div class="flex gap-2">
      <button class="h-10 px-4 rounded-xl border" @click="copyOut">複製輸出</button>
      <button class="h-10 px-4 rounded-xl border" @click="clearAll">清空</button>
    </div>
  </div> -->
  <div class="flex gap-4 w-full h-[80vh]">
  <!-- 左：輸入區 -->
  <div class="flex-1 flex flex-col">
    <div class="flex items-center gap-3 mb-2">
      <input v-model="className" class="border px-2 py-1 rounded" placeholder="Class 名稱" />
      <select v-model="lang" class="border px-2 py-1 rounded">
        <option value="dart">Dart</option>
        <option value="swift">Swift</option>
        <option value="kotlin">Kotlin</option>
        <option value="ts">TypeScript</option>
        <option value="csharp">C#</option>
        <option value="go">Go</option>
        <option value="python">Python</option>
        <option value="rust">Rust</option>
        <option value="php">PHP</option>
        <option value="java">Java</option>
      </select>

      <button class="px-4 py-1 rounded bg-blue-500 text-white" @click="run">產生</button>

      <button class="px-4 py-1 rounded border" @click="clearAll">
        清空
      </button>
      
    </div>

    <textarea
      class="box flex-1"
      v-model="inputJson"
      placeholder="貼上 JSON..."
    ></textarea>
  </div>

  <!-- 右：輸出區 -->
  <div class="flex-1 flex flex-col">
    <button class="h-10 px-4 rounded-xl border" @click="copyOut">複製輸出</button>
    <div class="mb-2 text-green-600">{{ msg }}</div>
    <textarea
      class="box flex-1"
      readonly
      v-model="output"
      placeholder="產生的 Model 會顯示在這..."
    ></textarea>
  </div>
</div>
</template>