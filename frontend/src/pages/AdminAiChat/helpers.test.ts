import {
  formatAssistantMetadata,
  formatToolRunSummary,
  getToolRunCollections,
  normalizeModelOptions,
  normalizeModelPresetOptions,
} from "./helpers";
import { AdminAiChatMessage, AdminAiChatToolRun } from "../../components/services/adminAiChat";

describe("AdminAiChat helpers", () => {
  it("formats assistant metadata", () => {
    const message: AdminAiChatMessage = {
      _id: "m1",
      threadId: "t1",
      role: "assistant",
      content: "Done",
      status: "done",
      metadata: {
        model: "gpt-4.1-mini",
        provider: "openai",
        durationMs: 4200,
        status: "completed",
        toolCallsSummary: { count: 3 },
      },
    };

    expect(formatAssistantMetadata(message)).toBe("gpt-4.1-mini · 4.2s · 3 tools · completed");
  });

  it("formats fallback metadata", () => {
    const message: AdminAiChatMessage = {
      _id: "m1",
      threadId: "t1",
      role: "assistant",
      content: "Fallback",
      status: "error",
      metadata: {
        status: "error",
        errorCode: "OPENAI_DISABLED",
      },
    };

    expect(formatAssistantMetadata(message)).toBe("AI fallback · error · OPENAI_DISABLED");
  });

  it("extracts collections and safe summary for tool runs", () => {
    const toolRun: AdminAiChatToolRun = {
      _id: "run1",
      name: "fomoV2FindProject",
      status: "done",
      resultSummary: {
        collectionsRead: ["canonical_projects", "source_entities"],
        hasError: false,
      },
    };

    expect(getToolRunCollections(toolRun)).toEqual(["canonical_projects", "source_entities"]);
    expect(formatToolRunSummary(toolRun)).toContain('"hasError": false');
    expect(formatToolRunSummary(toolRun)).not.toContain("collectionsRead");
  });

  it("normalizes selectable model options", () => {
    expect(
      normalizeModelOptions(["gpt-4.1-mini", "gpt-5.5", "gpt-5.5"], "gpt-5.5")
    ).toEqual({
      models: ["gpt-4.1-mini", "gpt-5.5"],
      defaultModel: "gpt-5.5",
    });
    expect(normalizeModelOptions([], "gpt-5.5")).toEqual({
      models: ["gpt-4.1-mini"],
      defaultModel: "gpt-4.1-mini",
    });
  });

  it("normalizes selectable model preset options", () => {
    expect(
      normalizeModelPresetOptions(
        [
          {
            key: "fast",
            label: "Fast",
            model: "gpt-4.1-mini",
            reasoningEffort: "low",
            maxToolIterations: 5,
            timeoutMs: 45000,
          },
          {
            key: "review",
            label: "Review High Quality",
            model: "gpt-5.5",
            reasoningEffort: "high",
            maxToolIterations: 10,
            timeoutMs: 90000,
          },
        ],
        "review"
      )
    ).toEqual({
      presets: [
        {
          key: "fast",
          label: "Fast",
          model: "gpt-4.1-mini",
          reasoningEffort: "low",
          maxToolIterations: 5,
          timeoutMs: 45000,
        },
        {
          key: "review",
          label: "Review High Quality",
          model: "gpt-5.5",
          reasoningEffort: "high",
          maxToolIterations: 10,
          timeoutMs: 90000,
        },
      ],
      defaultPreset: "review",
    });
    expect(normalizeModelPresetOptions([], "missing").defaultPreset).toBe("review");
  });
});
