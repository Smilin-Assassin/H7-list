// Edit an existing item — same modal-sheet pattern as addItem.js, but
// pre-filled from one item and saving with a partial updateItem() instead
// of creating a new document. Reached via /edit/:id (see router.js's
// param-matching overlays) from tapping an item's name/sub on the board.
import { subscribeMembers, getItem, updateItem, deleteItem } from "../data.js";
import { CATEGORIES, memberTagColor, escapeHtml, showToast } from "../util.js";
import { navigate } from "../router.js";

export function renderEditItem(currentUser, itemId) {
  const root = document.getElementById("modal-root");
  let members = null;
  let unsubMembers = subscribeMembers((m) => { members = m; paint(); });

  let item = null; // null = still loading the item itself
  let notFound = false;
  let form = null; // populated once the item loads
  let nameError = "";
  let saving = false;
  let deleting = false;
  let hasOpened = false;

  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  function onKeydown(e) {
    if (e.key === "Escape") navigate("/");
  }
  document.addEventListener("keydown", onKeydown);

  getItem(itemId).then((doc) => {
    if (!doc) {
      notFound = true;
      paint();
      return;
    }
    item = doc;
    form = {
      name: item.name || "",
      category: item.category || "groceries",
      quantity: item.quantity || 1,
      assigneeId: item.assigneeId || null,
      cost: item.costEstimate != null ? String(item.costEstimate) : "",
      note: item.note || "",
    };
    paint();
  }).catch(() => {
    notFound = true;
    paint();
  });

  function memberChipsHtml() {
    if (members === null) return `<div style="display:flex;gap:10px"><div class="skeleton" style="width:44px;height:44px;border-radius:999px;margin-top:0"></div><div class="skeleton" style="width:44px;height:44px;border-radius:999px;margin-top:0"></div></div>`;
    const ids = Object.keys(members);
    if (ids.length === 0) return `<p style="font-size:13px;color:var(--ink-faint)">No one's joined the household yet.</p>`;
    return `
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        ${ids.map((uid) => `
          <button type="button" class="tag-btn" style="--tag-color:${memberTagColor(uid)}" data-assignee="${uid}" aria-pressed="${form.assigneeId === uid}" aria-label="${escapeHtml(members[uid].displayName)}${form.assigneeId === uid ? ', selected' : ''}">
            ${escapeHtml(members[uid].initial)}
          </button>`).join("")}
        <button type="button" class="chip" data-assignee="" aria-pressed="${form.assigneeId === null}">Unassigned</button>
      </div>
    `;
  }

  function bodyHtml() {
    if (notFound) {
      return `<div class="content" style="padding-top:var(--space-5);padding-bottom:24px">
        <p style="color:var(--ink-faint);font-size:14px">This item isn't on the board anymore — it may have already been cleared or removed.</p>
      </div>`;
    }
    if (!form) {
      return `<div class="content" style="padding-top:var(--space-5);padding-bottom:24px">
        <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
      </div>`;
    }
    return `
      <div class="content" style="padding-top:var(--space-5);padding-bottom:24px">
        <div class="field">
          <label for="iname">Item name</label>
          <input id="iname" type="text" value="${escapeHtml(form.name)}" aria-invalid="${!!nameError}">
          ${nameError ? `<p class="field-error" role="alert">${escapeHtml(nameError)}</p>` : ""}
        </div>

        <div class="field">
          <span class="field-label">Category</span>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${CATEGORIES.map((c) => `<button type="button" class="chip" data-category="${c.id}" aria-pressed="${form.category === c.id}">${c.label}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <span class="field-label">Quantity</span>
          <div class="stepper">
            <button type="button" id="qty-minus" aria-label="Decrease quantity">-</button>
            <span id="qty-value" style="font-size:15px;font-weight:600;min-width:16px;text-align:center">${form.quantity}</span>
            <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div class="field">
          <span class="field-label">Assign to</span>
          ${memberChipsHtml()}
        </div>

        <div class="field">
          <label for="cost">Estimated cost (optional)</label>
          <div class="money-input">
            <span class="prefix">Rf</span>
            <input id="cost" type="text" inputmode="decimal" placeholder="0.00" value="${escapeHtml(form.cost)}">
          </div>
        </div>

        <div class="field">
          <label for="note">Note (optional)</label>
          <textarea id="note" placeholder="Any details…" style="height:64px;resize:none">${escapeHtml(form.note)}</textarea>
        </div>

        <button type="button" id="delete-item" class="btn-text" style="color:var(--danger);margin-top:var(--space-2)" ${deleting ? "disabled" : ""}>${deleting ? "Removing…" : "Delete item"}</button>
      </div>`;
  }

  function paint() {
    const openCls = hasOpened ? " is-open" : "";
    root.innerHTML = `
      <div class="modal-backdrop${openCls}" id="modal-backdrop">
        <div class="modal-sheet${openCls}" role="dialog" aria-modal="true" aria-labelledby="edit-item-title">
          <div class="sheet-header">
            <button type="button" class="icon-btn" aria-label="Close" id="close-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <h1 id="edit-item-title">Edit item</h1>
            <span style="width:40px"></span>
          </div>

          ${bodyHtml()}

          ${form && !notFound ? `
          <div class="sheet-footer">
            <button type="button" id="save-item" class="btn btn-primary" ${saving ? "disabled" : ""}>${saving ? "Saving…" : "Save changes"}</button>
          </div>` : ""}
        </div>
      </div>
    `;
    attachHandlers();

    if (!hasOpened) {
      requestAnimationFrame(() => {
        const backdrop = document.getElementById("modal-backdrop");
        if (!backdrop) return;
        backdrop.classList.add("is-open");
        const sheet = backdrop.querySelector(".modal-sheet");
        if (sheet) sheet.classList.add("is-open");
        hasOpened = true;
      });
    }
  }

  function attachHandlers() {
    document.getElementById("close-btn").addEventListener("click", () => navigate("/"));
    document.getElementById("modal-backdrop").addEventListener("click", (e) => {
      if (e.target.id === "modal-backdrop") navigate("/");
    });

    if (!form || notFound) return;

    const nameInput = document.getElementById("iname");
    nameInput.addEventListener("input", () => { form.name = nameInput.value; });
    nameInput.addEventListener("blur", () => {
      nameError = form.name.trim() ? "" : "Give the item a name.";
      if (nameError) paint();
    });

    document.getElementById("cost").addEventListener("input", (e) => { form.cost = e.target.value; });
    document.getElementById("note").addEventListener("input", (e) => { form.note = e.target.value; });

    document.getElementById("qty-minus").addEventListener("click", () => {
      form.quantity = Math.max(1, form.quantity - 1);
      document.getElementById("qty-value").textContent = form.quantity;
    });
    document.getElementById("qty-plus").addEventListener("click", () => {
      form.quantity = Math.min(99, form.quantity + 1);
      document.getElementById("qty-value").textContent = form.quantity;
    });

    root.querySelectorAll("[data-category]").forEach((el) => {
      el.addEventListener("click", () => { form.category = el.dataset.category; paint(); });
    });
    root.querySelectorAll("[data-assignee]").forEach((el) => {
      el.addEventListener("click", () => { form.assigneeId = el.dataset.assignee || null; paint(); });
    });

    document.getElementById("save-item").addEventListener("click", async () => {
      const nameVal = document.getElementById("iname").value.trim();
      if (!nameVal) {
        nameError = "Give the item a name.";
        paint();
        document.getElementById("iname").focus();
        return;
      }
      const costVal = document.getElementById("cost").value.trim();
      const costNumber = costVal ? parseFloat(costVal) : null;
      saving = true;
      paint();
      try {
        await updateItem(itemId, {
          name: nameVal,
          category: form.category,
          quantity: form.quantity,
          assigneeId: form.assigneeId,
          costEstimate: Number.isFinite(costNumber) ? costNumber : null,
          note: document.getElementById("note").value.trim(),
        });
        showToast("Item updated");
        navigate("/");
      } catch (err) {
        saving = false;
        paint();
        showToast("Couldn't save that — check your connection and try again.");
      }
    });

    document.getElementById("delete-item").addEventListener("click", async () => {
      if (!window.confirm(`Remove "${form.name}" from the board? This can't be undone.`)) return;
      deleting = true;
      paint();
      try {
        await deleteItem(itemId);
        showToast("Item removed");
        navigate("/");
      } catch (err) {
        deleting = false;
        paint();
        showToast("Couldn't remove that — check your connection and try again.");
      }
    });
  }

  paint();

  return () => {
    unsubMembers();
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = prevBodyOverflow;
    root.innerHTML = "";
  };
}
