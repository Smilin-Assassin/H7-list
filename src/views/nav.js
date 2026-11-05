export function bottomNavHtml(active) {
  const item = (href, label, path, iconSvg) => `
    <a href="#${href}" aria-current="${active === path ? "page" : "false"}">
      ${iconSvg}
      <span>${label}</span>
    </a>`;
  return `
    <nav class="bottom-nav" aria-label="Primary">
      ${item("/", "Board", "list", `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9.5h17M8.5 9.5v10" stroke="currentColor" stroke-width="1.6"/></svg>`)}
      ${item("/archive", "Cleared", "archive", `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M4 9.5h16M8.5 13.5h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`)}
      ${item("/me", "Me", "me", `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c1.4-3.6 4.4-5.2 7-5.2s5.6 1.6 7 5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`)}
    </nav>`;
}
