import { Injectable } from "@nestjs/common";
import { RatingFormulaModeConfig } from "./rating.types";

type ScorePenalty = { key: string; value: number; reason: string };
type ScoreCap = { key: string; value: number; reason: string };

export type ConfigurableScoreResult = {
  version: string;
  score: number;
  components: Record<string, number>;
  penalties?: ScorePenalty[];
  caps?: ScoreCap[];
  calculatedAt: Date;
  [key: string]: any;
};

@Injectable()
export class RatingFormulaService {
  applyRating(
    breakdown: ConfigurableScoreResult,
    config: RatingFormulaModeConfig,
    audit: Record<string, any> = {}
  ): ConfigurableScoreResult {
    const components = this.scaleComponents(
      breakdown.components,
      config.componentWeights
    );
    const penalties = (breakdown.penalties || []).map((penalty) => ({
      ...penalty,
      value: this.round(
        penalty.value * this.multiplier(config.penaltyMultipliers, penalty.key)
      ),
    }));
    const componentScore = this.sum(components);
    const penaltyScore = penalties.reduce(
      (sum, penalty) => sum + Math.abs(penalty.value),
      0
    );
    const uncappedScore = Math.round(componentScore - penaltyScore);
    const configuredCaps = config.preserveDefaultCaps
      ? (breakdown.caps || []).map((cap) => ({
          ...cap,
          value: Object.prototype.hasOwnProperty.call(config.capValues, cap.key)
            ? config.capValues[cap.key]
            : cap.value,
        }))
      : [];
    const boundedScore = this.clamp(
      Math.round(uncappedScore),
      config.minScore,
      config.maxScore
    );
    const cappedScore = configuredCaps.reduce(
      (score, cap) => Math.min(score, this.number(cap.value)),
      boundedScore
    );
    const score = this.isDefaultConfig(config, breakdown)
      ? breakdown.score
      : this.clamp(Math.round(cappedScore), 0, 100);

    return {
      ...breakdown,
      score,
      components,
      penalties,
      caps: configuredCaps,
      componentWeights: { ...config.componentWeights },
      penaltyMultipliers: { ...config.penaltyMultipliers },
      inputs: {
        ...(breakdown.inputs || {}),
        configuredFormula: true,
        componentScore: this.round(componentScore),
        penaltyScore: this.round(penaltyScore),
        uncappedScore,
        preserveDefaultCaps: config.preserveDefaultCaps,
        defaultCaps: breakdown.caps || [],
        ...audit,
      },
    };
  }

  applyFullness(
    breakdown: ConfigurableScoreResult,
    config: RatingFormulaModeConfig,
    audit: Record<string, any> = {}
  ): ConfigurableScoreResult {
    const components = this.scaleComponents(
      breakdown.components,
      config.fullnessComponentWeights
    );
    const uncappedScore = Math.round(this.sum(components));
    const score = this.hasOnlyUnitMultipliers(config.fullnessComponentWeights)
      ? breakdown.score
      : this.clamp(uncappedScore, 0, 100);

    return {
      ...breakdown,
      score,
      components,
      componentWeights: { ...config.fullnessComponentWeights },
      inputs: {
        ...(breakdown.inputs || {}),
        configuredFormula: true,
        uncappedScore,
        ...audit,
      },
    };
  }

  private scaleComponents(
    components: Record<string, number> = {},
    weights: Record<string, number> = {}
  ): Record<string, number> {
    return Object.fromEntries(
      Object.entries(components).map(([key, value]) => [
        key,
        this.round(this.number(value) * this.multiplier(weights, key)),
      ])
    );
  }

  private multiplier(values: Record<string, number>, key: string): number {
    const value = values?.[key];
    return Number.isFinite(Number(value)) ? Number(value) : 1;
  }

  private isDefaultConfig(
    config: RatingFormulaModeConfig,
    breakdown: ConfigurableScoreResult
  ): boolean {
    return (
      config.minScore === 0 &&
      config.maxScore === 100 &&
      config.preserveDefaultCaps === true &&
      this.hasOnlyUnitMultipliers(config.componentWeights) &&
      this.hasOnlyUnitMultipliers(config.penaltyMultipliers) &&
      (breakdown.caps || []).every(
        (cap) =>
          !Object.prototype.hasOwnProperty.call(config.capValues, cap.key) ||
          Number(config.capValues[cap.key]) === Number(cap.value)
      )
    );
  }

  private hasOnlyUnitMultipliers(values: Record<string, number>): boolean {
    return Object.values(values || {}).every((value) => Number(value) === 1);
  }

  private sum(values: Record<string, number>): number {
    return Object.values(values).reduce(
      (sum, value) => sum + this.number(value),
      0
    );
  }

  private number(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
