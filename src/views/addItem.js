// Pattern 3 — Form, shown as a modal sheet over whatever screen is
// already open (usually the Duty Board) rather than a full-page
// navigation — see registerOverlay in router.js. The screen behind it
// stays mounted and live the whole time; this just layers a blurred
// backdrop + sheet on top and tears itself down on close.
import { subscribeMembers, addItem } from "../data.js";
import { CATEGORIES, memberTagColor, escapeHtml, showToast } from "../util.js";
import { navigate } from "../router.js";

export function renderAddItem(currentUser) {
  const root = document.getElementById("modal-root");
  let members = null; // null = still loading, distinct from a genuinely empty household
  let unsubMembers = subscribeMembers((m) => { members = m; paint(); });

  const form = {
    name: "",
    category: "groceries",
    quantity: 1,
    assigneeId: null,
    cost: "",
    note: "",
  };
  let nameError = "";
  let saving = false;
  let hasOpened = false; // true once the open transition has run, so later
                          // re-paints (every keystroke) don't replay it

  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  function onKeydown(e) {
    if (e.key === "Escape") navigate("/");
  }
  document.addEventListener("keydown", onKeydown);

  function memberChipsHtml() {
    if (members === null) return `<div style="display:flex;gap:10px"><div class="skeleton" style="width:44px;height:44px;border-radius:999px;margin-top:0"></div><div class="skeleton" style="width:44px;height:44px;border-radius:999px;margin-top:0"></div><div class="skeleton" style="width:44px;height:44px;border-radius:999px;margin-top:0"></div></div>`;
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

  function paint() {
    const openCls = hasOpened ? " is-open" : "";
    root.innerHTML = `
      <div class="modal-backdrop${openCls}" id="modal-backdrop">
        <div class="modal-sheet${openCls}" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
          <div class="sheet-header">
            <button type="button" class="icon-btn" aria-label="Close" id="close-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <h1 id="add-item-title">New item</h1>
            <span style="width:40px"></span>
          </div>

          <div class="content" style="padding-top:var(--space-5);padding-bottom:24px">
            <div class="field">
              <label for="iname">Item name</label>
              <input id="iname" type="text" placeholder="e.g. Milk (2L)" value="${escapeHtml(form.name)}" aria-invalid="${!!nameError}">
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
          </div>

          <div class="sheet-footer">
            <button type="button" id="submit-item" class="btn btn-primary" ${saving ? "disabled" : ""}>${saving ? "Adding…" : "Add to list"}</button>
          </div>
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

    // Close on a tap/click that lands on the dimmed backdrop itself,
    // not one that bubbled up from inside the sheet.
    document.getElementById("modal-backdrop").addEventListener("click", (e) => {
      if (e.target.id === "modal-backdrop") navigate("/");
    });

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

    document.getElementById("submit-item").addEventListener("click", async () => {
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
        await addItem({
          name: nameVal,
          category: form.category,
          quantity: form.quantity,
          assigneeId: form.assigneeId,
          costEstimate: Number.isFinite(costNumber) ? costNumber : null,
          note: document.getElementById("note").value.trim(),
          createdBy: currentUser.uid,
        });
        showToast("Added to the list");
        navigate("/");
      } catch (err) {
        saving = false;
        paint();
        showToast("Couldn't add that — check your connection and try again.");
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
