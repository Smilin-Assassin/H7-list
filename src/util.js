export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function initialOf(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

let toastTimer = null;
export function showToast(message) {
  let el = document.getElementById("h7-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "h7-toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = "none"; }, 2600);
}

export function formatCurrency(amount) {
  if (amount == null || Number.isNaN(amount)) return "";
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rf ${Math.abs(amount).toFixed(2).replace(/\.00$/, "")}`;
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const CATEGORIES = [
  { id: "groceries", label: "Groceries", color: "var(--cat-groceries)" },
  { id: "household", label: "Household", color: "var(--cat-household)" },
  { id: "maintenance", label: "Maintenance", color: "var(--cat-maintenance)" },
  { id: "other", label: "Other", color: "var(--cat-other)" },
];

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || "Other";
}
export function categoryColor(id) {
  return CATEGORIES.find((c) => c.id === id)?.color || "var(--cat-other)";
}

// Every household member gets a laminated name-tag color, stable across
// sessions — picked from the tag palette by a cheap hash of their uid so
// it never has to be chosen or stored.
const TAG_PALETTE = ["var(--tag-1)", "var(--tag-2)", "var(--tag-3)", "var(--tag-4)", "var(--tag-5)"];
export function memberTagColor(uid) {
  if (!uid) return TAG_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}
