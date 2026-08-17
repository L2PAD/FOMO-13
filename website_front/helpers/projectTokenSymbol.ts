import { IProject } from "../types/global_types";

const firstText = (...values: any[]): string => {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
};

export const resolveProjectTokenSymbol = (
  project?: Partial<IProject> | null,
  source?: any
): string => {
  return firstText(
    source?.project?.symbol,
    source?.project?.ticker,
    source?.symbol,
    source?.ticker,
    project?.symbol,
    project?.ticker
  );
};

export const resolveProjectTokenDisplaySymbol = (
  project?: Partial<IProject> | null,
  source?: any
): string => resolveProjectTokenSymbol(project, source).toUpperCase();
