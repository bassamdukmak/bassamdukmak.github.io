"use client";

import { useState } from "react";

type Tab = { label: string; title: string; lines: string[] };

export function ProgrammeTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(0);
  const current = tabs[active];
  return <section className="programme-tabs" aria-label={label}>
    <div role="tablist" aria-label={label}>{tabs.map((tab, index) => <button key={tab.label} type="button" role="tab" aria-selected={active === index} onClick={() => setActive(index)}>{tab.label}</button>)}</div>
    <div role="tabpanel"><h3>{current.title}</h3><ul>{current.lines.map((line) => <li key={line}>{line}</li>)}</ul></div>
  </section>;
}
