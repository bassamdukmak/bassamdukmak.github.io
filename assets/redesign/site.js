(() => {
  "use strict";

  const path = `${location.pathname.replace(/index\.html$/, "").replace(/\/+$/, "") || "/"}/`.replace("//", "/");
  const main = document.querySelector("#main-content, main");
  if (main && !main.id) main.id = "main-content";

  const navigationSections = new Map([
    ["/", "/"],
    ["/hero-options/", "/welcome/"],
    ...["/welcome/", "/ourteam/", "/board/", "/careers/", "/189-2/"].map((route) => [route, "/welcome/"]),
    ...[
      "/2025-admission/", "/2026-2027-admission-process/", "/2025-26-program-cost/",
      "/2026-2027-program-cost/", "/waitlist-policy/", "/edchoice-at-oia/",
      "/edchoice-how-to-apply/", "/uniform/", "/2026-2027-admission-form/",
      "/admission-form-2-242280/", "/registration/", "/inquiry/", "/tour-2/",
      "/4th-grade-form/", "/thankyou/",
    ].map((route) => [route, "/2026-2027-admission-process/"]),
    ["/contact-us/", "/contact-us/"],
    ...[
      "/student-life/", "/calendar/", "/2025-26-calendar/", "/2026-2027-calendar/",
      "/faq/", "/gallery/", "/newsletter/", "/jumah-bites-2/", "/login/",
      "/my-account-2/", "/lost-password/", "/student-handbook/", "/school-supply-list/",
    ].map((route) => [route, "/student-life/"]),
    ...["/donations/", "/membership-pricing/"].map((route) => [route, "/donations/"]),
  ]);
  const activeSection = navigationSections.get(path);

  document.querySelectorAll("[data-oia-route]").forEach((link) => {
    if (link.dataset.oiaRoute === activeSection) link.setAttribute("aria-current", "page");
  });

  document.querySelectorAll("a[href^='http']").forEach((link) => {
    if (new URL(link.href).origin === location.origin) return;
    link.target = "_blank";
    link.rel = "noreferrer";
  });

  const supplyNoticeKey = "oia-supply-list-dismissed-2026-27";
  let supplyNoticeDismissed = false;
  try {
    supplyNoticeDismissed = localStorage.getItem(supplyNoticeKey) === "true";
  } catch {}
  if (!supplyNoticeDismissed) {
    const notice = document.createElement("aside");
    notice.className = "oia-supply-notice";
    notice.setAttribute("role", "region");
    notice.setAttribute("aria-live", "polite");
    notice.setAttribute("aria-labelledby", "oia-supply-notice-title");
    notice.innerHTML = `
      <button class="oia-supply-notice-close" type="button" aria-label="Dismiss school supply list notice">×</button>
      <span class="oia-supply-notice-mark" aria-hidden="true">✎</span>
      <p class="oia-supply-notice-kicker">Current Families · 2026–2027</p>
      <h2 id="oia-supply-notice-title">School Supply List</h2>
      <p>Prepare for the school year with OIA’s current classroom supply list.</p>
      <a class="oia-supply-notice-link" href="/school-supply-list/">View Supply List <span aria-hidden="true">→</span></a>`;
    document.body.append(notice);
    setTimeout(() => notice.classList.add("oia-is-visible"), 350);
    notice.querySelector(".oia-supply-notice-close").addEventListener("click", () => {
      try {
        localStorage.setItem(supplyNoticeKey, "true");
      } catch {}
      notice.classList.remove("oia-is-visible");
      setTimeout(() => notice.remove(), 220);
    });
  }

  document.querySelectorAll(".et_pb_toggle").forEach((toggle, index) => {
    const title = toggle.querySelector(".et_pb_toggle_title");
    const content = toggle.querySelector(".et_pb_toggle_content");
    if (!title || !content) return;
    const id = content.id || `oia-toggle-${index + 1}`;
    content.id = id;
    title.tabIndex = 0;
    title.setAttribute("role", "button");
    title.setAttribute("aria-controls", id);
    const setOpen = (open) => {
      toggle.classList.toggle("oia-is-open", open);
      title.setAttribute("aria-expanded", String(open));
      content.hidden = !open;
    };
    setOpen(toggle.classList.contains("et_pb_toggle_open"));
    const activate = () => setOpen(!toggle.classList.contains("oia-is-open"));
    title.addEventListener("click", activate);
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });

  document.querySelectorAll(".et_pb_slider").forEach((slider, sliderIndex) => {
    const slides = [...slider.querySelectorAll(".et_pb_slide")];
    if (!slides.length) return;
    let current = 0;
    const show = (next) => {
      current = (next + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        const active = index === current;
        slide.classList.toggle("oia-is-active", active);
        slide.hidden = !active;
        slide.setAttribute("aria-hidden", String(!active));
      });
    };
    show(0);
    if (slides.length < 2) return;
    const controls = document.createElement("div");
    controls.className = "oia-slider-controls";
    controls.setAttribute("aria-label", `Carousel ${sliderIndex + 1} controls`);
    const previous = document.createElement("button");
    previous.type = "button";
    previous.setAttribute("aria-label", "Previous slide");
    previous.textContent = "←";
    const next = document.createElement("button");
    next.type = "button";
    next.setAttribute("aria-label", "Next slide");
    next.textContent = "→";
    previous.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));
    controls.append(previous, next);
    slider.after(controls);
  });

  document.querySelectorAll("form").forEach((form) => {
    const pages = [...form.querySelectorAll(":scope .wpforms-page")];
    if (pages.length < 2) return;
    const indicator = form.querySelector("[role='progressbar']");
    const currentLabel = form.querySelector(".wpforms-page-indicator-steps-current");
    let current = Math.max(0, pages.findIndex((page) => page.style.display !== "none" && !page.hidden));
    const showPage = (next) => {
      current = Math.max(0, Math.min(next, pages.length - 1));
      pages.forEach((page, index) => {
        const active = index === current;
        page.hidden = !active;
        page.style.display = active ? "block" : "none";
        page.setAttribute("aria-hidden", String(!active));
      });
      form.querySelectorAll(".wpforms-page-prev").forEach((button) => {
        button.disabled = current === 0;
        button.setAttribute("aria-disabled", String(current === 0));
      });
      form.querySelectorAll(".wpforms-page-next").forEach((button) => {
        button.disabled = current === pages.length - 1;
        button.setAttribute("aria-disabled", String(current === pages.length - 1));
      });
      if (indicator) indicator.setAttribute("aria-valuenow", String(current + 1));
      if (currentLabel) currentLabel.textContent = String(current + 1);
      pages[current].querySelector("h1, h2, h3, legend, label")?.setAttribute("tabindex", "-1");
    };
    form.addEventListener("click", (event) => {
      const button = event.target.closest(".wpforms-page-next, .wpforms-page-prev");
      if (!button) return;
      event.preventDefault();
      showPage(current + (button.classList.contains("wpforms-page-next") ? 1 : -1));
      pages[current].querySelector("h1, h2, h3, legend, label")?.focus({ preventScroll: true });
    });
    showPage(current);
  });

  const imageLinks = [...document.querySelectorAll(".et_pb_gallery a[href], a.et_pb_lightbox_image[href]")]
    .filter((link) => /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i.test(link.href));
  if (imageLinks.length && "HTMLDialogElement" in window) {
    const dialog = document.createElement("dialog");
    dialog.className = "oia-lightbox";
    dialog.innerHTML = '<button type="button" aria-label="Close image">×</button><img alt="">';
    document.body.append(dialog);
    const image = dialog.querySelector("img");
    dialog.querySelector("button").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    imageLinks.forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector("img")?.alt || "Ohio Ihsan Academy gallery image";
      dialog.showModal();
    }));
  }

  if (!(matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    const items = document.querySelectorAll("#main-content .et_pb_row, main.hub > section");
    items.forEach((item) => item.classList.add("oia-reveal"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("oia-visible");
      observer.unobserve(entry.target);
    }), { rootMargin: "0px 0px -8%", threshold: 0.08 });
    items.forEach((item) => observer.observe(item));
  }
})();
