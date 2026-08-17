import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2ParserControlConfig,
  FomoV2ParserControlConfigDocument,
  FomoV2ParserControlMode,
  FomoV2ParserGlobalControl,
  FomoV2ParserGlobalControlDocument,
  FomoV2ParserRunMode,
} from "../../../models/parser-control.model";
import { FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID } from "../parser-control.constants";

export interface FomoV2ParserExecutionPolicyInput {
  globalEnabled: boolean;
  globalMode: FomoV2ParserControlMode;
  paused: boolean;
  requestedMode: FomoV2ParserRunMode;
}

export interface FomoV2ParserExecutionPolicy {
  canRun: boolean;
  canWrite: boolean;
  effectiveMode: FomoV2ParserRunMode;
  writesDomainData: boolean;
  downgraded: boolean;
  blockedReason?: "global-off" | "parser-paused" | "test-mode";
}

/** Pure policy used by HTTP queuing and re-checked by the worker. */
export function resolveFomoV2ParserExecutionPolicy(
  input: FomoV2ParserExecutionPolicyInput
): FomoV2ParserExecutionPolicy {
  if (!input.globalEnabled) {
    return {
      canRun: false,
      canWrite: false,
      effectiveMode: "dry-run",
      writesDomainData: false,
      downgraded: input.requestedMode === "write",
      blockedReason: "global-off",
    };
  }
  if (input.paused) {
    return {
      canRun: false,
      canWrite: false,
      effectiveMode: "dry-run",
      writesDomainData: false,
      downgraded: input.requestedMode === "write",
      blockedReason: "parser-paused",
    };
  }
  if (input.globalMode === "test") {
    return {
      canRun: true,
      canWrite: false,
      effectiveMode: "dry-run",
      writesDomainData: false,
      downgraded: input.requestedMode === "write",
      blockedReason:
        input.requestedMode === "write" ? "test-mode" : undefined,
    };
  }
  return {
    canRun: true,
    canWrite: true,
    effectiveMode: input.requestedMode,
    writesDomainData: input.requestedMode === "write",
    downgraded: false,
  };
}

@Injectable()
export class FomoV2ParserControlPolicyService {
  constructor(
    @InjectModel(FomoV2ParserGlobalControl.name)
    private readonly globalModel: Model<FomoV2ParserGlobalControlDocument>,
    @InjectModel(FomoV2ParserControlConfig.name)
    private readonly configModel: Model<FomoV2ParserControlConfigDocument>
  ) {}

  async getGlobalState(): Promise<{
    enabled: boolean;
    mode: FomoV2ParserControlMode;
    revision: number;
    updatedAt?: Date;
    updatedByAdminId?: string;
  }> {
    const id = new Types.ObjectId(FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID);
    let document = await this.globalModel.findById(id).lean().exec();
    if (!document) {
      document = await this.globalModel
        .findOneAndUpdate(
          { _id: id },
          {
            $setOnInsert: {
              enabled: false,
              mode: "test",
              revision: 0,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        .lean()
        .exec();
    }
    return {
      enabled: Boolean(document?.enabled),
      mode: document?.mode === "prod" ? "prod" : "test",
      revision: Number(document?.revision || 0),
      updatedAt: document?.updatedAt,
      updatedByAdminId: document?.updatedByAdminId,
    };
  }

  async resolve(
    parserKey: string,
    requestedMode: FomoV2ParserRunMode
  ): Promise<FomoV2ParserExecutionPolicy & { globalMode: FomoV2ParserControlMode }> {
    const [global, config] = await Promise.all([
      this.getGlobalState(),
      this.configModel
        .findOne({ parserKey: String(parserKey || "").trim() })
        .select({ paused: 1 })
        .lean()
        .exec(),
    ]);
    return {
      globalMode: global.mode,
      ...resolveFomoV2ParserExecutionPolicy({
        globalEnabled: global.enabled,
        globalMode: global.mode,
        paused: Boolean(config?.paused),
        requestedMode,
      }),
    };
  }

  /**
   * Fail-closed boundary for direct service/CLI write calls. Managed workers
   * call it too, so UI state can never be used as the security decision.
   */
  async assertDomainWriteAllowed(parserKey: string): Promise<void> {
    const policy = await this.resolve(parserKey, "write");
    if (policy.canRun && policy.writesDomainData) return;
    const reason =
      policy.blockedReason === "global-off"
        ? "global parser control is OFF"
        : policy.blockedReason === "parser-paused"
        ? `parser ${parserKey} is paused`
        : "global parser mode is TEST";
    throw new ForbiddenException(
      `Parser domain writes are blocked because ${reason}. Use dry-run or enable PROD write mode in Admin Data Sync.`
    );
  }

  async canWriteDomainData(parserKey: string): Promise<boolean> {
    const policy = await this.resolve(parserKey, "write");
    return policy.canRun && policy.writesDomainData;
  }
}
