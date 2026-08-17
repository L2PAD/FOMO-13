import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { CryptoActivityReactionType } from "../models/crypto-activity-reaction.model";

const toInt = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : undefined;
};

const toBoolean = (value: any): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

export class CryptoActivityListQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(0)
  @Max(100000)
  offset?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  excludeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  difficulty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sort?: string;

  @IsOptional()
  hasInvestors?: boolean | string;

  @IsOptional()
  favourite?: boolean | string;

  @IsOptional()
  favorite?: boolean | string;
}

export class CryptoActivityFilterQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CryptoActivityCalendarQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  month?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  project?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(0)
  @Max(100000)
  offset?: number;
}

export class CryptoActivityUserStateDto {
  isFavourite: boolean;
  reaction?: string | null;
  isAddedToCalendar: boolean;
  completedStepIds?: string[];
  stepsCompleted?: number;
  stepsTotal?: number;
  stepsProgress?: number;
}

export class CryptoActivityListItemDto {
  [key: string]: any;
  userState?: CryptoActivityUserStateDto;
}

export class CryptoActivityDetailDto extends CryptoActivityListItemDto {
  similarProjects?: CryptoActivityListItemDto[];
}

export class CryptoActivityUpdateDto {
  nftRequired?: boolean | string;
  flags?: {
    green?: string[];
    yellow?: string[];
    red?: string[];
  };
}

export class CryptoActivityReactionDto {
  @IsIn(["like", "dislike", "hot", "interested"])
  reaction: CryptoActivityReactionType;
}

export class CryptoActivityReportDto {
  @IsString()
  @MaxLength(120)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

export class CryptoActivityCalendarDto {
  @IsOptional()
  date?: Date | string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CryptoActivityStepProgressDto {
  @IsOptional()
  @IsArray()
  completedStepIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  stepId?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  completed?: boolean;
}

export class CryptoActivityBoardQueryDto {
  boardId?: string;
  search?: string;
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export class CryptoActivityBoardDto {
  title: string;
  icon?: string;
  order?: number;
}

export class CryptoActivityBoardColumnDto {
  title: string;
  order?: number;
}

export class CryptoActivityBoardTaskDto {
  activityId?: string;
  boardId?: string;
  columnId?: string;
  title?: string;
  projectName?: string;
  projectPlatform?: string;
  projectLogo?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  notes?: string;
  sourceUrl?: string;
  tags?: string[];
  rewards?: any[];
  requirements?: string[];
  dueDate?: Date | string;
  scheduledDate?: Date | string;
  status?: string;
  order?: number;
}

export class CryptoActivitiesSyncDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  maxPages?: number;

  @IsOptional()
  dryRun?: boolean;

  @IsOptional()
  force?: boolean;
}
