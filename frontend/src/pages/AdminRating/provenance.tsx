import React from "react";
import { useStyles } from "./styles";
import { sourceLabel } from "./labels";

/** Russian labels for every provenance / data-mode value. */
export const PROV_LABEL: Record<string, string> = {
  derived: "реальный источник",
  manual: "ручной ввод",
  mock: "демо (mock)",
  missing: "нет данных",
  stale: "устарело",
};

export const modeClass = (classes: any, mode?: string) =>
  mode === "derived"
    ? classes.srcDerived
    : mode === "manual"
    ? classes.srcManual
    : mode === "mock"
    ? classes.srcMock
    : mode === "stale"
    ? classes.srcStale
    : classes.srcMissing;

/** A single provenance/source badge. `label` overrides the auto RU text. */
export const SourceBadge = ({
  source,
  label,
  testId,
}: {
  source?: string;
  label?: string;
  testId?: string;
}) => {
  const classes = useStyles();
  if (!source) return null;
  return (
    <span
      className={`${classes.srcBadge} ${modeClass(classes, source)}`}
      data-testid={testId}
    >
      {label ?? PROV_LABEL[source] ?? sourceLabel(source)}
    </span>
  );
};

export const ProvenanceLegend = () => {
  const classes = useStyles();
  return (
    <div className={classes.provLegend} data-testid="provenance-legend">
      {["derived", "manual", "mock", "missing", "stale"].map((m) => (
        <span key={m} className={`${classes.srcBadge} ${modeClass(classes, m)}`}>
          {PROV_LABEL[m]}
        </span>
      ))}
    </div>
  );
};
