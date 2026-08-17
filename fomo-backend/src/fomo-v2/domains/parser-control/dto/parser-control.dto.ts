import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import {
  FOMO_V2_PARSER_CONTROL_MAX_INTERVAL_MINUTES,
  FOMO_V2_PARSER_CONTROL_MIN_INTERVAL_MINUTES,
} from "../parser-control.constants";
import {
  FOMO_V2_UPSTREAM_PIPELINE_KEYS,
  FomoV2UpstreamPipelineKey,
} from "../upstream-parser-flow.constants";

export class UpdateFomoV2ParserGlobalControlDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(["test", "prod"])
  mode?: "test" | "prod";
}

export class UpdateFomoV2ParserControlDto {
  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @IsOptional()
  @IsBoolean()
  scheduleEnabled?: boolean;

  @IsOptional()
  @IsIn(["dry-run", "write"])
  defaultRunMode?: "dry-run" | "write";

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(FOMO_V2_PARSER_CONTROL_MIN_INTERVAL_MINUTES)
  @Max(FOMO_V2_PARSER_CONTROL_MAX_INTERVAL_MINUTES)
  intervalMinutes?: number;
}

export class RunFomoV2ParserDto {
  @IsIn(["dry-run", "write"])
  mode: "dry-run" | "write";

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class UpstreamAutoImportDto {
  @IsIn(FOMO_V2_UPSTREAM_PIPELINE_KEYS as readonly string[])
  pipelineKey: FomoV2UpstreamPipelineKey;

  @IsIn(["dry-run", "write"])
  mode: "dry-run" | "write";

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100_000)
  limit?: number;
}

export class StartUpstreamParserRunDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100_000)
  entityLimit: number;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpstreamAutoImportDto)
  autoImport?: UpstreamAutoImportDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique((entry: UpstreamAutoImportDto) => entry?.pipelineKey)
  @ValidateNested({ each: true })
  @Type(() => UpstreamAutoImportDto)
  autoImports?: UpstreamAutoImportDto[];
}

export class UpdateUpstreamParserDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @IsOptional()
  @IsBoolean()
  scheduleEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(FOMO_V2_PARSER_CONTROL_MAX_INTERVAL_MINUTES)
  intervalMinutes?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100_000)
  defaultEntityLimit?: number;

}

export class UpdateUpstreamAutoImportPolicyDto {
  @IsIn(["off", "dry-run", "write"])
  autoImportMode: "off" | "dry-run" | "write";

  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  autoImportTargets: FomoV2UpstreamPipelineKey[];
}

export class ImportParserSnapshotDto {
  @IsIn(FOMO_V2_UPSTREAM_PIPELINE_KEYS as readonly string[])
  pipelineKey: FomoV2UpstreamPipelineKey;

  @IsIn(["dry-run", "write"])
  mode: "dry-run" | "write";

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100_000)
  limit?: number;
}

export class ListUpstreamRunsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  parserKey?: string;
}
