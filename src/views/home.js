// Pattern 1 — List / Index, read as a duty board: ruled category
// row-groups, one laminated name tag per row. See the direction
// contract in .impeccable/surfaces/src-views-home-js.md.
import { subscribeItems, subscribeMembers, markItemDone, markItemOpen, requestHelp, archiveIfCycleComplete } from "../data.js";
import { CATEGORIES, categoryLabel, categoryColor, memberTagColor, escapeHtml, showToast, formatCurrency } from "../util.js";
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
      ? `On ${escapeHtml(memberName(item.assigneeId))}`
      : "Unassigned";
    const subLabel = done ? `Bought by ${escapeHtml(memberName(item.doneBy))}` : assigneeLabel;
    const canAskHelp = !done && item.assigneeId && item.assigneeId === currentUser.uid && !item.helpRequested;
    return `
      <div class="item-row">
        <button type="button" class="checkbox-square ${done ? "is-checked" : ""}" data-item-id="${item.id}" data-action="toggle" aria-label="${done ? "Mark not bought" : "Mark bought"}">
          ${done ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="var(--board-sunken)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}
        </button>
        <button type="button" style="flex:1;text-align:left;min-width:0" data-item-id="${item.id}" data-action="toggle">
          <span class="item-name ${done ? "is-done" : ""}" style="display:block">${escapeHtml(item.name)}${item.quantity > 1 ? ` ×${item.quantity}` : ""}</span>
          <span class="item-sub" style="display:block">${subLabel}${item.costEstimate != null ? ` · ${formatCurrency(item.costEstimate)}` : ""}</span>
          ${item.helpRequested && !done ? `<span class="flare-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l1.2 7.2L20 12l-6.8 2.8L12 22l-1.2-7.2L4 12l6.8-2.8L12 2z" fill="currentColor"/></svg>Needs a hand</span>` : ""}
        </button>
        ${canAskHelp ? `
          <button type="button" class="flare-btn" data-item-id="${item.id}" data-action="help" aria-label="Ask for help with this">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l1.2 7.2L20 12l-6.8 2.8L12 22l-1.2-7.2L4 12l6.8-2.8L12 2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          </button>
        ` : ""}
        ${item.assigneeId ? `<span class="tag" style="--tag-color:${memberTagColor(item.assigneeId)}" aria-hidden="true">${escapeHtml(memberInitial(item.assigneeId))}</span>` : ""}
      </div>
    `;
  }

  function sectionHtml(categoryId, list) {
    if (list.length === 0) return "";
    return `
      <div class="cat-group">
        <div class="cat-tab" style="--cat-color:${categoryColor(categoryId)}">
          <span class="cat-dot"></span>
          ${categoryLabel(categoryId)}
        </div>
        ${list.map(itemRowHtml).join("")}
      </div>
    `;
  }

  function ledgerHtml() {
    const current = (items || []).filter((i) => !i.batchId);
    const spent = current.filter((i) => i.status === "done" && i.costEstimate != null)
      .reduce((sum, i) => sum + i.costEstimate, 0);
    const openCount = current.filter((i) => i.status !== "done").length;
    return `
      <div class="ledger-strip">
        <span class="ledger-label">${openCount === 0 ? "Board clear" : `${openCount} open`}</span>
        <span class="ledger-amount">${spent > 0 ? `Spent so far ${formatCurrency(spent)}` : "Rf 0.00 logged"}</span>
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
        <div class="empty-wrap">
          <div class="empty-state">
            <p class="empty-title">Board's clear</p>
            <p>Add something the household needs — groceries, supplies, a repair.</p>
            <button type="button" id="empty-add" class="btn btn-primary" style="width:auto;margin-top:8px">Add an item</button>
          </div>
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
            <p class="mark">H7</p>
            <h1>Duty board</h1>
          </div>
          <button type="button" class="icon-btn" aria-label="Notification settings" id="notif-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 10-12 0c0 3.5-1 5-2 7h16c-1-2-2-3.5-2-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.5 19a2.5 2.5 0 005 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
        ${ledgerHtml()}
        <div class="chip-row">${chipsHtml()}</div>
        <div class="content ruled-board">${contentHtml()}</div>
        <button type="button" class="cta-tag" aria-label="Add item" id="fab-add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
          Add
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
    const notif = document.getElementById("notif-btn");
    if (notif) notif.addEventListener("click", () => navigate("/me"));

    app.querySelectorAll("[data-filter]").forEach((el) => {
      el.addEventListener("click", () => { activeFilter = el.dataset.filter; paint(); });
    });

    app.querySelectorAll('[data-action="toggle"]').forEach((el) => {
      el.addEventListener("click", async () => {
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
