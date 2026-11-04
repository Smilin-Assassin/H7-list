// Pattern 1 — List / Index. One job: scan the shared list and manage it.
import { subscribeItems, subscribeMembers, markItemDone, markItemOpen, requestHelp, archiveIfCycleComplete } from "../data.js";
import { CATEGORIES, categoryLabel, categoryColor, escapeHtml, showToast } from "../util.js";
import { bottomNavHtml } from "./nav.js";
import { navigate } from "../router.js";

export function renderHome(currentUser) {
  const app = document.getElementById("app");
  let items = null; // null = loading
  let members = {};
  let activeFilter = "all";

  let unsubItems = subscribeItems((list) => { items = list; paint(); maybeArchive(); });
  let unsubMembers = subscribeMembers((m) => { members = m; paint(); });

  function maybeArchive() {
    if (!items) return;
    archiveIfCycleComplete(items, members).catch(() => {});
  }

  function visibleItems() {
    const current = (items || []).filter((i) => !i.batchId);
    if (activeFilter === "all") return current;
    return current.filter((i) => i.category === activeFilter);
  }

  function groupByCategory(list) {
    const groups = {};
    CATEGORIES.forEach((c) => { groups[c.id] = []; });
    list.forEach((i) => {
      const key = groups[i.category] ? i.category : "other";
      groups[key].push(i);
    });
    return groups;
  }

  function memberName(uid) {
    if (!uid) return "";
    return members[uid]?.displayName || "Someone";
  }
  function memberInitial(uid) {
    if (!uid) return "";
    return members[uid]?.initial || "?";
  }

  function itemRowHtml(item) {
    const done = item.status === "done";
    const assigneeLabel = item.assigneeId
      ? `Assigned to ${escapeHtml(memberName(item.assigneeId))}`
      : "Unassigned";
    const subLabel = done ? `Bought by ${escapeHtml(memberName(item.doneBy))}` : assigneeLabel;
    return `
      <button type="button" class="item-row ${done ? "is-done" : ""}" data-item-id="${item.id}" data-action="toggle">
        <span class="checkbox-circle ${done ? "is-checked" : ""}" aria-hidden="true">
          ${done ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}
        </span>
        <span style="flex:1;text-align:left">
          <span class="item-name ${done ? "is-done" : ""}" style="display:block">${escapeHtml(item.name)}${item.quantity > 1 ? ` ×${item.quantity}` : ""}</span>
          <span class="item-sub" style="display:block">${subLabel}</span>
          ${!done && item.assigneeId && item.assigneeId === currentUser.uid && !item.helpRequested ? `
            <span><button type="button" class="btn-text" style="font-size:11px;padding:0;margin-top:4px" data-item-id="${item.id}" data-action="help">Ask for help</button></span>
          ` : ""}
          ${item.helpRequested && !done ? `<span class="badge-help">Asked for help</span>` : ""}
        </span>
        ${item.assigneeId ? `<span class="avatar" aria-hidden="true">${escapeHtml(memberInitial(item.assigneeId))}</span>` : ""}
      </button>
    `;
  }

  function sectionHtml(categoryId, list) {
    if (list.length === 0) return "";
    return `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="section-label">
          <span class="dot" style="background:${categoryColor(categoryId)}"></span>
          ${categoryLabel(categoryId)}
        </div>
        ${list.map(itemRowHtml).join("")}
      </div>
    `;
  }

  function chipsHtml() {
    const all = `<button type="button" class="chip" data-filter="all" aria-pressed="${activeFilter === "all"}">All</button>`;
    const rest = CATEGORIES.map((c) => `<button type="button" class="chip" data-filter="${c.id}" aria-pressed="${activeFilter === c.id}">${c.label}</button>`).join("");
    return all + rest;
  }

  function contentHtml() {
    if (items === null) {
      return `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
    }
    const list = visibleItems();
    if (list.length === 0) {
      return `
        <div class="empty-state">
          <p style="font-size:15px;font-weight:600;color:var(--ink)">Nothing on the list right now</p>
          <p>Add something the household needs — groceries, supplies, a repair.</p>
          <button type="button" id="empty-add" class="btn btn-primary" style="width:auto;margin-top:8px">Add an item</button>
        </div>`;
    }
    const groups = groupByCategory(list);
    return CATEGORIES.map((c) => sectionHtml(c.id, groups[c.id])).join("");
  }

  function paint() {
    app.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <div>
            <p class="eyebrow">H7</p>
            <h1>Shared list</h1>
          </div>
          <button type="button" class="icon-btn" aria-label="Notifications" id="notif-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 10-12 0c0 3.5-1 5-2 7h16c-1-2-2-3.5-2-7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 19a2.5 2.5 0 005 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="chip-row">${chipsHtml()}</div>
        <div class="content">${contentHtml()}</div>
        <button type="button" class="fab" aria-label="Add item" id="fab-add">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
        ${bottomNavHtml("list")}
      </div>
    `;
    attachHandlers();
  }

  function attachHandlers() {
    const fab = document.getElementById("fab-add");
    if (fab) fab.addEventListener("click", () => navigate("/add"));
    const emptyAdd = document.getElementById("empty-add");
    if (emptyAdd) emptyAdd.addEventListener("click", () => navigate("/add"));

    app.querySelectorAll("[data-filter]").forEach((el) => {
      el.addEventListener("click", () => { activeFilter = el.dataset.filter; paint(); });
    });

    app.querySelectorAll('[data-action="toggle"]').forEach((el) => {
      el.addEventListener("click", async (e) => {
        if (e.target.closest('[data-action="help"]')) return;
        const id = el.dataset.itemId;
        const item = (items || []).find((i) => i.id === id);
        if (!item) return;
        try {
          if (item.status === "done") {
            await markItemOpen(id);
          } else {
            await markItemDone(id, currentUser.uid);
          }
        } catch (err) {
          showToast("Couldn't update that item — try again.");
        }
      });
    });

    app.querySelectorAll('[data-action="help"]').forEach((el) => {
      el.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await requestHelp(el.dataset.itemId);
          showToast("Let the household know you need a hand.");
        } catch (err) {
          showToast("Couldn't send that — try again.");
        }
      });
    });
  }

  paint();

  return () => {
    unsubItems();
    unsubMembers();
  };
}
