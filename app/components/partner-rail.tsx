"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { PartnerLogo } from "../content/site-content";
import styles from "./partner-rail.module.css";

type CredibilityMark = {
  key: string;
  name: string;
  logo: string;
  href?: string;
  tone?: "colour" | "ink";
};

const credibilityMarks: CredibilityMark[] = [
  {
    key: "uae-fa",
    name: "UAE FA",
    logo: "/partners/uae-fa.svg",
    tone: "colour",
  },
  {
    key: "radcliffe",
    name: "Radcliffe FC",
    logo: "/partners/radcliffe-crest.svg",
    tone: "colour",
  },
  {
    key: "silves",
    name: "Silves FC",
    logo: "/partners/silves-crest.webp",
    tone: "colour",
  },
  {
    key: "wimbledon-wealth",
    name: "Wimbledon Wealth",
    logo: "/partners/wimbledon-wealth-white.png",
    tone: "colour",
  },
  {
    key: "cheat-daze",
    name: "Cheat Daze",
    logo: "/partners/cheat-daze-transparent.png",
    tone: "ink",
  },
  {
    key: "farellys",
    name: "Farellys",
    logo: "/partners/farellys-transparent.png",
    tone: "ink",
  },
  {
    key: "arise-edge",
    name: "Arise Edge",
    logo: "/partners/arise-edge.svg",
    tone: "colour",
  },
  {
    key: "joe-thompson-foundation",
    name: "Joe Thompson Foundation",
    logo: "https://joethompsonfoundation.co.uk/wp-content/uploads/2025/10/JoeThompsonFoundation-1024x845.png",
    href: "https://joethompsonfoundation.co.uk/",
    tone: "colour",
  },
  {
    key: "holaskoko-football-academy",
    name: "Holaskoko Football Academy",
    logo: "https://static.wixstatic.com/media/6b9136_10ee794b31504993a3fa597ad9083458~mv2.jpg/v1/fill/w_1078,h_1052,al_c,q_85,enc_avif,quality_auto/6b9136_10ee794b31504993a3fa597ad9083458~mv2.jpg",
    href: "https://www.holaskokogroup.com/holaskokofootballacademy",
    tone: "colour",
  },
  {
    key: "spsa",
    name: "SPSA · Assess. Train. Succeed.",
    logo: "/partners/spsa-white.png",
    tone: "colour",
  },
];

function CredibilityCard({
  mark,
  href,
  duplicate = false,
  onError,
}: {
  mark: CredibilityMark;
  href?: string;
  duplicate?: boolean;
  onError: (logo: string) => void;
}) {
  const contents = (
    <span className={styles.logoPlate}>
      <img
        className={[
          mark.tone === "ink" ? styles.inkLogo : "",
          mark.key === "arise-edge" ? styles.ariseEdgeLogo : "",
        ]
          .filter(Boolean)
          .join(" ")}
        src={mark.logo}
        alt={duplicate ? "" : `${mark.name} logo`}
        loading="lazy"
        decoding="async"
        onError={() => onError(mark.logo)}
      />
    </span>
  );

  return (
    <li
      className={styles.card}
      aria-hidden={duplicate && !href ? true : undefined}
    >
      {href ? (
        <a
          className={styles.cardLink}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Visit ${mark.name}`}
        >
          {contents}
        </a>
      ) : (
        <span className={styles.cardBody}>{contents}</span>
      )}
    </li>
  );
}

export default function PartnerRail({ partners = [] }: { partners?: PartnerLogo[] }) {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(() => new Set());
  const publishedLinks = new Map(
    partners
      .filter((partner) => partner.status === "published" && partner.href)
      .map((partner) => [partner.name, partner.href]),
  );
  const visibleMarks = credibilityMarks.filter(
    (mark) => !failedLogos.has(mark.logo),
  );

  function hideMissingLogo(logo: string) {
    setFailedLogos((current) => {
      const next = new Set(current);
      next.add(logo);
      return next;
    });
  }

  if (visibleMarks.length === 0) return null;

  return (
    <div
      className={styles.viewport}
      role="region"
      aria-label="Phoenix network and licensing organisations"
    >
      <div className={styles.track}>
        {[false, true].map((duplicate) => (
          <ul
            className={`${styles.group} ${duplicate ? styles.duplicate : ""}`}
            aria-hidden={duplicate || undefined}
            key={duplicate ? "duplicate" : "primary"}
          >
            {visibleMarks.map((mark) => (
              <CredibilityCard
                key={`${duplicate ? "duplicate" : "primary"}-${mark.key}`}
                mark={mark}
                href={mark.href ?? publishedLinks.get(mark.name)}
                duplicate={duplicate}
                onError={hideMissingLogo}
              />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
