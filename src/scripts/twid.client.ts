import { generateTWID, validateTWID } from "@/tools/twid";

// 綁定「隨機產生」按鈕
const genBtn = document.getElementById("gen") as HTMLButtonElement | null;
genBtn?.addEventListener("click", () => {
  const genderVal = (document.getElementById("gender") as HTMLSelectElement).value;
const g = genderVal === "1" ? 1 : 2;
const v = generateTWID({ gender: g });
  (document.getElementById("id") as HTMLInputElement).value = v;
  (document.getElementById("msg") as HTMLParagraphElement).textContent =
    `產生：${v}（僅供測試）`;
});

// 綁定「檢查」按鈕
const chkBtn = document.getElementById("chk") as HTMLButtonElement | null;
chkBtn?.addEventListener("click", () => {
  const v = (document.getElementById("id") as HTMLInputElement)
    .value.trim()
    .toUpperCase();
  (document.getElementById("msg") as HTMLParagraphElement).textContent =
    validateTWID(v) ? "✅ 檢核通過" : "❌ 檢核失敗";
});