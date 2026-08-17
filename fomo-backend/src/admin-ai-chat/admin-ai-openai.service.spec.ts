import { AdminAiOpenAiService } from "./admin-ai-openai.service";
import { FomoV2AiRedactionService } from "./fomo-v2-context/fomo-v2-ai-redaction.service";

describe("AdminAiOpenAiService fallback handling", () => {
  it("parses comma-separated admin chat models", () => {
    const service = new AdminAiOpenAiService(
      {
        get: jest.fn((key: string) => {
          if (key === "OPEN_AI_ADMIN_CHAT_MODEL") {
            return "gpt-4.1-mini, gpt-5.5, gpt-5.5";
          }
          return undefined;
        }),
      } as any,
      { getToolDefinitions: jest.fn(() => []) } as any,
      new FomoV2AiRedactionService()
    );

    expect(service.getAvailableModels()).toEqual(["gpt-4.1-mini", "gpt-5.5", "gpt-4.1"]);
    expect(service.getModelPresets()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "review",
          label: "Review High Quality",
          model: "gpt-5.5",
          reasoningEffort: "high",
          maxToolIterations: 10,
          timeoutMs: 90000,
        }),
      ])
    );
    expect(service.getDefaultModelPreset()).toBe("review");
    expect(service.getDefaultModel()).toBe("gpt-5.5");
    expect(service.resolveModel("gpt-5.5")).toBe("gpt-5.5");
    expect(service.resolveModel(undefined, "fast")).toBe("gpt-4.1-mini");
    expect(service.resolveModelPresetKey("unknown")).toBe("review");
    expect(() => service.resolveModel("gpt-4o-mini")).toThrow(
      "Selected AI model is not available"
    );
  });

  it("returns a controlled fallback when OPEN_AI_SECRET_KEY is missing", async () => {
    const service = new AdminAiOpenAiService(
      {
        get: jest.fn((key: string) => {
          if (key === "OPEN_AI_ADMIN_CHAT_MODEL") return "gpt-4.1-mini,gpt-5.5";
          if (key === "AI_ADMIN_CHAT_OPENAI_ENABLED") return "true";
          return undefined;
        }),
      } as any,
      { getToolDefinitions: jest.fn(() => []) } as any,
      new FomoV2AiRedactionService()
    );

    const response = await service.createResponse({
      prompt: "Show FOMO v2 collection stats",
      history: [],
      cryptoContext: {},
      model: "gpt-5.5",
    });

    expect(response.status).toBe("error");
    expect(response.content).toBe("OpenAI API key is not configured. Message saved.");
    expect(response.metadata).toEqual(
      expect.objectContaining({
        provider: "openai",
        model: "gpt-5.5",
        modelPreset: "review",
        modelPresetLabel: "Review High Quality",
        reasoningEffort: "high",
        maxToolIterations: 10,
        timeoutMs: 90000,
        status: "error",
        errorCode: "missing_api_key",
      })
    );
    expect(JSON.stringify(response)).not.toContain("OPEN_AI_SECRET_KEY");
  });

  it("executes the last allowed tool round and then forces a tools-disabled final answer", async () => {
    const toolsService = {
      getToolDefinitions: jest.fn(() => [
        {
          type: "function",
          name: "fomoDevCount",
          description: "Count",
          parameters: { type: "object", properties: {} },
        },
      ]),
      executeTool: jest.fn(async () => ({
        tool: "fomoDevCount",
        generatedAt: new Date().toISOString(),
        data: { count: 1 },
      })),
    };
    const service = new AdminAiOpenAiService(
      {
        get: jest.fn((key: string) => {
          if (key === "OPEN_AI_ADMIN_CHAT_MODEL") return "gpt-4.1-mini";
          if (key === "AI_ADMIN_CHAT_OPENAI_ENABLED") return "true";
          if (key === "OPEN_AI_SECRET_KEY") return "test-key";
          return undefined;
        }),
      } as any,
      toolsService as any,
      new FomoV2AiRedactionService()
    );
    let requestNumber = 0;
    const create = jest.fn((request: any) => ({
      withResponse: async () => {
        requestNumber += 1;
        const isFinal = requestNumber === 6;
        if (isFinal) {
          expect(request.tools).toBeUndefined();
          return {
            request_id: `request-${requestNumber}`,
            data: { id: `response-${requestNumber}`, output: [], output_text: "Completed", status: "completed" },
          };
        }
        expect(request.tools).toHaveLength(1);
        return {
          request_id: `request-${requestNumber}`,
          data: {
            id: `response-${requestNumber}`,
            output: [
              {
                type: "function_call",
                name: "fomoDevCount",
                call_id: `call-${requestNumber}`,
                arguments: "{}",
              },
            ],
          },
        };
      },
    }));
    (service as any).client = { responses: { create } };

    const response = await service.createResponse({
      prompt: "Count several things",
      history: [],
      cryptoContext: {},
      modelPreset: "fast",
      toolContext: { accessMode: "read_only" },
    });

    expect(response.status).toBe("done");
    expect(response.content).toBe("Completed");
    expect(response.metadata.status).toBe("completed");
    expect(toolsService.executeTool).toHaveBeenCalledTimes(5);
    expect(create).toHaveBeenCalledTimes(6);
  });
});
