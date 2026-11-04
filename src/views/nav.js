export function bottomNavHtml(active) {
  const item = (href, label, path, iconSvg) => `
    <a href="#${href}" aria-current="${active === path ? "page" : "false"}">
      ${iconSvg}
      <span>${label}</span>
    </a>`;
  return `
    <nav class="bottom-nav" aria-label="Primary">
      ${item("/", "List", "list", `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`)}
      ${item("/archive", "Archive", "archive", `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" stroke-width="2"/><path d="M4 9h16" stroke="currentColor" stroke-width="2"/></svg>`)}
      ${item("/me", "Me", "me", `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="2"/><path d="M5 20c1.5-3.5 4.5-5 7-5s5.5 1.5 7 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`)}
    </nav>`;
}
