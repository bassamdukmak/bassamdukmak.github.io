"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InstagramFeed } from "./instagram-feed";

type ActivePage = "club" | "pathway" | "network" | "store" | "contact";
type ActiveSection = "partners" | "press" | null;
type TrackingChoice = "accepted" | "declined";
type TrackingWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & {
    callMethod?: (...args: unknown[]) => void;
    queue?: unknown[];
    loaded?: boolean;
    version?: string;
  };
  _fbq?: TrackingWindow["fbq"];
};

const TRACKING_STORAGE_KEY = "phoenix-tracking-consent";
const TRACKING_SETTINGS_EVENT = "phoenix-open-tracking-settings";

let trackingInitialization: Promise<void> | undefined;

function hasTrackingConsent() {
  try {
    return window.localStorage.getItem(TRACKING_STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

async function initializeTracking() {
  if (!hasTrackingConsent()) return;

  const response = await fetch("/api/tracking-config");
  if (!response.ok) return;

  const config = (await response.json()) as {
    ga4MeasurementId?: string;
    metaPixelId?: string;
  };
  if (!hasTrackingConsent()) return;

  const trackingWindow = window as TrackingWindow;

  if (config.ga4MeasurementId && !document.getElementById("ga4-script")) {
    trackingWindow.dataLayer = trackingWindow.dataLayer ?? [];
    trackingWindow.gtag = (...args: unknown[]) => {
      trackingWindow.dataLayer?.push(args);
    };
    trackingWindow.gtag("js", new Date());
    trackingWindow.gtag("config", config.ga4MeasurementId, {
      anonymize_ip: true,
    });

    const script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      config.ga4MeasurementId,
    )}`;
    document.head.appendChild(script);
  }

  if (config.metaPixelId && !document.getElementById("meta-pixel-script")) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    }) as NonNullable<TrackingWindow["fbq"]>;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    trackingWindow.fbq = fbq;
    trackingWindow._fbq = fbq;
    fbq("init", config.metaPixelId);
    fbq("track", "PageView");

    const script = document.createElement("script");
    script.id = "meta-pixel-script";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
}

export function enablePhoenixTracking() {
  if (!trackingInitialization) {
    trackingInitialization = initializeTracking().catch((error) => {
      trackingInitialization = undefined;
      throw error;
    });
  }
  return trackingInitialization;
}

export async function trackPhoenixLead(
  leadType: "player" | "partner",
  leadReference: string,
) {
  if (!hasTrackingConsent()) return;
  await enablePhoenixTracking();
  if (!hasTrackingConsent()) return;

  const trackingWindow = window as TrackingWindow;
  trackingWindow.gtag?.("event", "generate_lead", {
    lead_type: leadType,
    lead_reference: leadReference,
  });
  trackingWindow.fbq?.("track", "Lead", {
    content_category: leadType,
    content_name: leadReference,
  });
}

function activeProps(page: ActivePage, activePage: ActivePage) {
  return page === activePage ? { "aria-current": "page" as const } : {};
}

export function SiteHeader({ activePage }: { activePage: ActivePage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function syncActiveSection() {
      if (activePage !== "club") {
        setActiveSection(null);
        return;
      }
      const hash = window.location.hash.slice(1);
      setActiveSection(hash === "partners" || hash === "press" ? hash : null);
    }

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);
    return () => window.removeEventListener("hashchange", syncActiveSection);
  }, [activePage]);

  useEffect(() => {
    document.body.classList.toggle("menu-is-open", menuOpen);
    if (!menuOpen) {
      return () => document.body.classList.remove("menu-is-open");
    }

    const header = headerRef.current;
    const site = header?.closest(".final-site");
    const inertTargets = site
      ? Array.from(site.children).filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement && child !== header,
        )
      : [];
    inertTargets.forEach((target) => {
      target.inert = true;
    });

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab" || !header) return;

      const focusable = Array.from(
        header.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    window.requestAnimationFrame(() => {
      header
        ?.querySelector<HTMLElement>("#primary-navigation a")
        ?.focus();
    });

    return () => {
      document.body.classList.remove("menu-is-open");
      inertTargets.forEach((target) => {
        target.inert = false;
      });
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    function closeDesktopMenu(event: MediaQueryListEvent) {
      if (event.matches) setMenuOpen(false);
    }

    desktopQuery.addEventListener("change", closeDesktopMenu);
    return () => {
      desktopQuery.removeEventListener("change", closeDesktopMenu);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={`site-header${menuOpen ? " is-open" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Link
        className="brand-lockup"
        href="/"
        prefetch={false}
        aria-label="Phoenix United FC home"
        onClick={closeMenu}
      >
        <img
          src="/brand/phoenix-united-wordmark.svg"
          width={142}
          height={57}
          alt=""
          aria-hidden="true"
        />
      </Link>

      <a
        className="language-switch"
        href="?lang=ar"
        data-language-toggle
        aria-label="Switch language to Arabic"
      >
        العربية
      </a>

      <button
        ref={menuButtonRef}
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <nav id="primary-navigation" aria-label="Primary navigation">
        <div className="mobile-nav-brand" aria-hidden="true">
          <div>
            <img
              src="/brand/phoenix-united-wordmark.svg"
              width={148}
              height={59}
              alt=""
            />
            <span>Enter the tunnel · DXB 01</span>
          </div>
        </div>

        <Link
          href="/"
          prefetch={false}
          {...(activePage === "club" && activeSection === null
            ? { "aria-current": "page" as const }
            : {})}
          onClick={() => {
            setActiveSection(null);
            closeMenu();
          }}
        >
          <span className="nav-index">01</span>
          <strong>The Club</strong>
        </Link>
        <Link
          href="/pathway"
          prefetch={false}
          {...activeProps("pathway", activePage)}
          onClick={closeMenu}
        >
          <span className="nav-index">02</span>
          <strong>Pathway</strong>
        </Link>
        <Link
          href="/store"
          prefetch={false}
          {...activeProps("store", activePage)}
          onClick={closeMenu}
        >
          <span className="nav-index">03</span>
          <strong>Culture</strong>
        </Link>
        <Link
          className="desktop-subnav"
          href="/network"
          prefetch={false}
          aria-current={
            activePage === "network" ? "page" : undefined
          }
          onClick={() => {
            setActiveSection(null);
            closeMenu();
          }}
        >
          <span className="nav-index">04</span>
          <strong>Network</strong>
        </Link>
        <Link
          className="desktop-subnav"
          href="/#press"
          prefetch={false}
          aria-current={
            activePage === "club" && activeSection === "press"
              ? "location"
              : undefined
          }
          onClick={() => {
            setActiveSection("press");
            closeMenu();
          }}
        >
          <span className="nav-index">05</span>
          <strong>News</strong>
        </Link>
        <Link
          className="header-cta"
          href="/pathway#assessment"
          prefetch={false}
          onClick={closeMenu}
        >
          <span className="header-cta-desktop">Apply</span>
          <span className="header-cta-mobile">Apply</span>
        </Link>

        <div className="mobile-nav-route" aria-hidden="true">
          <span className="is-current">DXB</span>
          <i />
          <span>MAN</span>
          <i />
          <span>ALG</span>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  function openTrackingSettings() {
    window.dispatchEvent(new Event(TRACKING_SETTINGS_EVENT));
  }

  return (
    <footer>
      <InstagramFeed />

      <div className="footer-brand">
        <img
          src="/brand/phoenix-united-wordmark.svg"
          width={190}
          height={76}
          alt="Phoenix United"
        />
        <p>Strive to Rise</p>
      </div>

      <div className="footer-contact">
        <div>
          <span>Player and partnership enquiries</span>
          <Link href="/contact">Contact Phoenix or book a call</Link>
        </div>
        <div>
          <span>Follow the club</span>
          <a
            href="https://www.instagram.com/phoenix_utdfc"
            target="_blank"
            rel="noreferrer"
          >
            @phoenix_utdfc
          </a>
        </div>
        <div>
          <span>Based in</span>
          <p>Dubai, United Arab Emirates</p>
        </div>
      </div>

      <div className="footer-bottom">
        <img
          src="/brand/arabic-slogan-transparent.png"
          width={214}
          height={139}
          alt="Strive to Rise in Arabic calligraphy"
        />
        <div>
          <Link href="/privacy">Privacy</Link>
          <button type="button" onClick={openTrackingSettings}>
            Cookie settings
          </button>
          <span>© 2026 Phoenix United FC</span>
        </div>
      </div>
    </footer>
  );
}

export function TrackingConsent() {
  const [choice, setChoice] = useState<TrackingChoice | "pending" | null>(null);

  useEffect(() => {
    let savedChoice: string | null = null;
    try {
      savedChoice = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-focused browsing modes.
    }

    if (savedChoice === "accepted" || savedChoice === "declined") {
      window.queueMicrotask(() => {
        setChoice(savedChoice as TrackingChoice);
        if (savedChoice === "accepted") {
          void enablePhoenixTracking();
        }
      });
    } else {
      window.queueMicrotask(() => setChoice("pending"));
    }

    function openSettings() {
      setChoice("pending");
    }

    window.addEventListener(TRACKING_SETTINGS_EVENT, openSettings);
    return () => {
      window.removeEventListener(TRACKING_SETTINGS_EVENT, openSettings);
    };
  }, []);

  function chooseTracking(nextChoice: TrackingChoice) {
    const trackingAlreadyLoaded = Boolean(
      document.getElementById("ga4-script") ||
        document.getElementById("meta-pixel-script"),
    );

    try {
      window.localStorage.setItem(TRACKING_STORAGE_KEY, nextChoice);
    } catch {
      // The visitor's choice still applies to this page if storage is blocked.
    }
    setChoice(nextChoice);

    if (nextChoice === "accepted") {
      void enablePhoenixTracking();
    } else if (trackingAlreadyLoaded) {
      window.location.reload();
    } else {
      trackingInitialization = undefined;
    }
  }

  if (choice !== "pending") return null;

  return (
    <aside
      className="tracking-consent"
      aria-label="Analytics and advertising preferences"
    >
      <div>
        <strong>Choose how Phoenix measures this visit.</strong>
        <p>
          With permission, Phoenix uses Google Analytics and Meta Pixel to
          understand campaigns and safely stored enquiries. The assessment
          works either way. <Link href="/privacy">Read the privacy notice.</Link>
        </p>
      </div>
      <div className="tracking-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => chooseTracking("declined")}
        >
          Essential only
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => chooseTracking("accepted")}
        >
          Allow analytics
        </button>
      </div>
    </aside>
  );
}
