<script setup lang="ts">
import { ref, watch } from "vue";
import { encodeBase64, decodeBase64 } from "@/tools/base64";

const input = ref("");
const output = ref("");
const error = ref("");
const copiedMsg = ref("");
const imageInput = ref("");
const imageError = ref("");
const imagePreviewSrc = ref("");
const isImageDragOver = ref(false);
const imageTextMode = ref<"dataUrl" | "base64">("dataUrl");

function detectImageMime(base64: string): string {
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";
  if (base64.startsWith("Qk")) return "image/bmp";
  if (base64.startsWith("PHN2Zy")) return "image/svg+xml";
  return "image/png";
}

function downloadPreviewImage() {
  if (!imagePreviewSrc.value) return;
  const match = imagePreviewSrc.value.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,/,
  );
  const mime = match?.[1] ?? "image/png";
  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
  };
  const ext = extMap[mime] ?? "png";
  const a = document.createElement("a");
  a.href = imagePreviewSrc.value;
  a.download = `base64-image.${ext}`;
  a.click();
}

function toDataUrl(base64: string): string {
  const cleaned = base64.replace(/\s+/g, "");
  const mime = detectImageMime(cleaned);
  return `data:${mime};base64,${cleaned}`;
}

function toPureBase64(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  return (match?.[1] ?? trimmed).replace(/\s+/g, "");
}

function convertImageInputMode(mode: "dataUrl" | "base64") {
  imageTextMode.value = mode;
  if (!imageInput.value.trim()) return;

  if (mode === "base64") {
    imageInput.value = toPureBase64(imageInput.value);
    return;
  }

  const pure = toPureBase64(imageInput.value);
  if (!pure) return;
  imageInput.value = toDataUrl(pure);
}

function formatImageTextByMode(dataUrl: string): string {
  return imageTextMode.value === "base64" ? toPureBase64(dataUrl) : dataUrl;
}

function openImagePicker() {
  const input = document.getElementById(
    "image-file-picker",
  ) as HTMLInputElement | null;
  input?.click();
}

function loadImageFileAsBase64(file: File) {
  if (!file.type.startsWith("image/")) {
    imageError.value = "請選擇圖片檔案";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    if (!result.startsWith("data:image/")) {
      imageError.value = "圖片讀取失敗";
      return;
    }
    imageError.value = "";
    imageInput.value = formatImageTextByMode(result);
  };
  reader.onerror = () => {
    imageError.value = "圖片讀取失敗";
  };
  reader.readAsDataURL(file);
}

function onImageFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  loadImageFileAsBase64(file);
  target.value = "";
}

function onImageDragOver(e: DragEvent) {
  e.preventDefault();
  isImageDragOver.value = true;
}

function onImageDragLeave(e: DragEvent) {
  e.preventDefault();
  isImageDragOver.value = false;
}

function onImageDrop(e: DragEvent) {
  e.preventDefault();
  isImageDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  loadImageFileAsBase64(file);
}

function copyToClipboard(text: string, label: string) {
  const val = typeof text === "string" ? text : String(text ?? "");
  if (!val) return;
  navigator.clipboard
    .writeText(val)
    .then(() => {
      copiedMsg.value = `${label} 已複製`;
      setTimeout(() => (copiedMsg.value = ""), 1500);
    })
    .catch(() => {});
}

// 雙向同步：input 改動 → 更新 output
watch(input, (val) => {
  error.value = "";
  output.value = encodeBase64(val);
});

// output 改動 → 更新 input；若 Base64 無效，清空對側並顯示錯誤
watch(output, (val) => {
  // 每次重新輸入都先清空錯誤與左側
  error.value = "";
  input.value = "";
  if (!val) return;
  const decoded = decodeBase64(val);
  if (decoded.startsWith("⚠️")) {
    error.value = decoded; // 顯示錯誤訊息
    return;
  }
  input.value = decoded;
});

watch(imageInput, (val) => {
  imageError.value = "";
  imagePreviewSrc.value = "";

  const raw = val.trim();
  if (!raw) return;

  if (raw.startsWith("data:image/")) {
    imagePreviewSrc.value = raw;
    return;
  }

  const cleaned = raw.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/=]+$/.test(cleaned) || cleaned.length % 4 !== 0) {
    imageError.value = "無效的 Base64 圖片字串";
    return;
  }

  try {
    atob(cleaned);
    const mime = detectImageMime(cleaned);
    imagePreviewSrc.value = `data:${mime};base64,${cleaned}`;
  } catch {
    imageError.value = "無效的 Base64 圖片字串";
  }
});
</script>

<template>
  <!-- 原始字串 -->
  <div class="space-y-1">
    <div class="flex justify-between items-center">
      <span class="font-medium">原始字串</span>
      <button
        type="button"
        class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
        @click="copyToClipboard(input, '原始字串')"
      >
        複製
      </button>
    </div>
    <textarea
      v-model="input"
      rows="6"
      placeholder="輸入原始字串"
      class="w-full rounded-2xl border px-3 py-2 font-mono"
    />
  </div>

  <!-- Base64 -->
  <div class="space-y-1">
    <div class="flex justify-between items-center">
      <span class="font-medium">Base64</span>
      <button
        type="button"
        class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
        @click="copyToClipboard(output, 'Base64')"
      >
        複製
      </button>
    </div>
    <textarea
      v-model="output"
      rows="6"
      placeholder="輸入或顯示 Base64"
      :class="[
        'w-full rounded-2xl border px-3 py-2 font-mono',
        error
          ? 'border-red-500 focus-visible:outline-red-500'
          : 'border-neutral-300 dark:border-neutral-700',
      ]"
    />
  </div>

  <!-- 訊息顯示 -->
  <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  <p v-if="copiedMsg" class="text-sm text-green-600">{{ copiedMsg }}</p>

  <div
    class="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2"
  >
    <div class="flex justify-between items-center">
      <span class="font-medium">Base64 轉圖片</span>
      <div class="flex gap-2">
        <button
          type="button"
          class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @click="copyToClipboard(imageInput, '圖片 Base64')"
        >
          複製
        </button>
        <button
          type="button"
          class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @click="
            convertImageInputMode(
              imageTextMode === 'dataUrl' ? 'base64' : 'dataUrl',
            )
          "
        >
          {{
            imageTextMode === "dataUrl" ? "切換為純 Base64" : "切換為 Data URL"
          }}
        </button>
        <button
          type="button"
          class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @click="openImagePicker"
        >
          選擇圖片
        </button>
        <button
          type="button"
          class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @click="imageInput = ''"
        >
          清空
        </button>
        <button
          type="button"
          class="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
          :disabled="!imagePreviewSrc"
          @click="downloadPreviewImage"
        >
          下載圖片
        </button>
      </div>
    </div>

    <input
      id="image-file-picker"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onImageFileChange"
    />

    <div
      :class="[
        'rounded-2xl border border-dashed px-3 py-4 text-sm text-center transition-colors',
        isImageDragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-neutral-300 dark:border-neutral-700',
      ]"
      @dragover="onImageDragOver"
      @dragleave="onImageDragLeave"
      @drop="onImageDrop"
    >
      拖曳圖片到這裡，或點擊「選擇圖片」自動轉成 Base64
    </div>

    <textarea
      v-model="imageInput"
      rows="5"
      placeholder="貼上 Base64（可含 data:image/...;base64, 前綴）"
      :class="[
        'w-full rounded-2xl border px-3 py-2 font-mono',
        imageError
          ? 'border-red-500 focus-visible:outline-red-500'
          : 'border-neutral-300 dark:border-neutral-700',
      ]"
    />

    <p v-if="imageError" class="text-sm text-red-600">{{ imageError }}</p>

    <div
      class="rounded-2xl border border-neutral-300 dark:border-neutral-700 p-3 min-h-[160px] grid place-items-center bg-neutral-50 dark:bg-neutral-900/40"
    >
      <img
        v-if="imagePreviewSrc"
        :src="imagePreviewSrc"
        alt="Base64 image preview"
        class="max-h-72 w-auto object-contain"
      />
      <p v-else class="text-sm text-neutral-500">尚未產生圖片預覽</p>
    </div>
  </div>
</template>
