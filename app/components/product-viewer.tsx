"use client";

import Image from "next/image";
import { useState } from "react";
import type { KitFeature } from "../content/kit-media";
import styles from "../store/store.module.css";

export function ProductViewer({ feature }: { feature: KitFeature }) {
  const views = feature.editorialImage
    ? [
        {
          id: "campaign",
          label: "Campaign",
          image: feature.editorialImage,
        },
        ...feature.views,
      ]
    : feature.views;
  const [activeViewId, setActiveViewId] = useState(views[0].id);
  const activeView =
    views.find((view) => view.id === activeViewId) ?? views[0];
  const panelId = `${feature.id}-active-view`;

  return (
    <fieldset
      className={`${styles.productViewer} ${
        views.length === 2
          ? styles.twoViews
          : views.length === 3
            ? styles.threeViews
            : styles.fourViews
      }`}
    >
      <legend className={styles.visuallyHidden}>
        Choose a view of {feature.title}
      </legend>
      <figure
        className={`${styles.viewPanel} ${
          activeView.id === "campaign" ? styles.campaignPanel : ""
        }`}
        id={panelId}
      >
        <Image
          key={activeView.id}
          src={activeView.image.src}
          alt={activeView.image.alt}
          fill
          priority
          sizes="(max-width: 760px) 100vw, 44vw"
          unoptimized
          style={{
            objectFit: activeView.id === "campaign" ? "cover" : "contain",
          }}
        />
      </figure>
      <div className={styles.viewControls}>
        {views.map((view) => {
          const isActive = view.id === activeView.id;
          return (
            <button
              className={styles.viewButton}
              type="button"
              aria-controls={panelId}
              aria-pressed={isActive}
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
            >
              {view.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
