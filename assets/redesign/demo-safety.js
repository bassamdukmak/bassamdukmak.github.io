(() => {
  "use strict";

  const MESSAGE = "Demo only—nothing was sent or saved.";
  const HIGH_RISK = [
    "/2026-2027-admission-form",
    "/admission-form-2-242280",
    "/registration",
    "/donations",
    "/login",
    "/lost-password",
    "/my-account-2",
  ];
  const ACCOUNT = ["/login", "/lost-password", "/my-account-2"];
  const route = location.pathname.replace(/\/+$/, "") || "/";
  const matchesRoute = (path) => route === path || route.endsWith(path);
  const highRisk = HIGH_RISK.some(matchesRoute);

  function isNavigation(control) {
    return control.matches(
      "[aria-controls], [aria-expanded], [data-step], [data-page], " +
        "[data-action='next'], [data-action='previous'], " +
        ".wpforms-page-button, .wpforms-page-next, .wpforms-page-prev, " +
        ".accordion-trigger"
    );
  }

  function isSubmit(control) {
    if (!control.matches("button, input")) return false;
    const type = (control.getAttribute("type") || "").toLowerCase();
    return (
      (control.tagName === "BUTTON" && (!type || type === "submit")) ||
      (control.tagName === "INPUT" && (type === "submit" || type === "image"))
    ) && !isNavigation(control);
  }

  function isSensitive(control) {
    if (control.matches("canvas, iframe, [contenteditable]")) return true;
    const type = (control.getAttribute("type") || "").toLowerCase();
    if (type === "password" || type === "file") return true;
    const details = [control.id, control.getAttribute("name"), control.getAttribute("class"), control.closest("[data-field-type]")?.dataset.fieldType].join(" ");
    return /(?:card|bank|payment|signature|square|stripe|paypal|cc-)/i.test(details);
  }

  function addDescription(control, id) {
    const ids = new Set((control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    ids.add(id);
    control.setAttribute("aria-describedby", [...ids].join(" "));
  }

  function lock(control, banner) {
    control.dataset.demoDisabled = "true";
    control.setAttribute("aria-disabled", "true");
    addDescription(control, banner.id);
    if ("disabled" in control) control.disabled = true;
    else {
      control.setAttribute("inert", "");
      control.tabIndex = -1;
      control.style.pointerEvents = "none";
    }
  }

  function isSearchForm(form) {
    if (form.matches("[role='search'], .search-form, .wp-block-search")) return true;
    const fields = [...form.elements].filter((field) => field.type !== "hidden" && !isSubmit(field));
    return fields.length > 0 && fields.every((field) => field.type === "search");
  }

  function addBanner() {
    let banner = document.querySelector(".oia-demo-notice");
    if (banner) return banner;
    banner = document.createElement("div");
    banner.id = "oia-demo-notice";
    banner.className = "oia-demo-notice";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.textContent = MESSAGE;
    Object.assign(banner.style, {
      background: "#F5F0EB",
      borderBlock: "2px solid #51bfce",
      color: "#0F4F4A",
      fontWeight: "700",
      padding: ".75rem 1rem",
      textAlign: "center",
    });
    const main = document.querySelector("main, #main-content");
    if (main) main.before(banner);
    else document.body.prepend(banner);
    return banner;
  }

  function showBlocked(form) {
    let status = form.nextElementSibling;
    if (!status || !status.matches(".oia-demo-status")) {
      status = document.createElement("p");
      status.className = "oia-demo-status";
      status.setAttribute("role", "alert");
      status.setAttribute("aria-live", "assertive");
      Object.assign(status.style, {
        borderInlineStart: "4px solid #51bfce",
        color: "#0F4F4A",
        fontWeight: "700",
        marginBlock: "1rem",
        padding: ".75rem 1rem",
      });
      form.after(status);
    }
    status.textContent = MESSAGE;
  }

  function blockSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.target.hasAttribute("data-demo-self-check")) showBlocked(event.target);
  }

  function apply() {
    const forms = [...document.forms];
    forms.forEach((form) => { form.dataset.demoGuarded = "true"; });
    const needsBanner = highRisk || ACCOUNT.some(matchesRoute) || forms.some((form) => !isSearchForm(form));
    if (!needsBanner) return;
    const banner = addBanner();
    forms.forEach((form) => {
      form.querySelectorAll("input, select, textarea, button, canvas, iframe, [contenteditable], .wpforms-save-resume-button").forEach((control) => {
        if ((highRisk && !isNavigation(control)) || (!highRisk && isSensitive(control))) lock(control, banner);
      });
    });
  }

  function check() {
    const probe = document.createElement("form");
    probe.hidden = true;
    probe.dataset.demoSelfCheck = "true";
    document.body.append(probe);
    const event = new Event("submit", { bubbles: true, cancelable: true });
    probe.dispatchEvent(event);
    probe.remove();
    const formsGuarded = [...document.forms].every((form) => form.dataset.demoGuarded === "true");
    const unlocked = [...document.querySelectorAll("form input, form select, form textarea, form button, form canvas, form iframe, form [contenteditable], form .wpforms-save-resume-button")]
      .filter((control) => (highRisk ? !isNavigation(control) : isSensitive(control)) && control.dataset.demoDisabled !== "true").length;
    return Object.freeze({
      passed: event.defaultPrevented && formsGuarded && unlocked === 0,
      submissionPrevented: event.defaultPrevented,
      formsGuarded,
      highRisk,
      unlockedSensitiveControls: unlocked,
    });
  }

  function start() {
    window.addEventListener("submit", blockSubmit, true);
    window.addEventListener("click", (event) => {
      const control = event.target.closest("button, input[type='submit'], input[type='image']");
      if (!control || !control.form || !isSubmit(control)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showBlocked(control.form);
    }, true);
    HTMLFormElement.prototype.submit = function demoSubmit() { showBlocked(this); };
    apply();
    const api = { message: MESSAGE, highRisk, check };
    api.lastCheck = check();
    window.OIADemoSafety = Object.freeze(api);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
