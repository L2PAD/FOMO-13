import { IAdminTabColumn, ICustomTabs } from "../model/tab.model";

export class CreateTabDto {
  image?: string;

  includedAssets: string[];

  excludedAssets: string[];

  tabs: (ICustomTabs & { blockName: string })[];

  name: string;

  description: string;

  saved: string[];

  pined: string[];

  status: "New" | "Trending";

  dateUpdate: Date;

  creator: string;

  arrayPlace: number;

  isPublic?: boolean;
}

export class UpdateTabDto {
  image?: string;

  includedAssets: string[];

  excludedAssets: string[];

  tabs: (ICustomTabs & { blockName: string })[];

  name: string;

  description: string;

  creator: string;

  isPublic?: boolean;
}

export class AdminTabColumnDto implements IAdminTabColumn {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  blockName?: string;
  name?: string;
}

export class CreateAdminTabDto {
  image?: string;
  name: string;
  key: string;
  description?: string;
  type?: string;
  isActive?: boolean;
  isGlobal?: boolean;
  sortOrder?: number;
  columns?: AdminTabColumnDto[];
  filters?: Record<string, any>;
}

export class UpdateAdminTabDto {
  image?: string;
  name?: string;
  key?: string;
  description?: string;
  type?: string;
  isActive?: boolean;
  isGlobal?: boolean;
  sortOrder?: number;
  columns?: AdminTabColumnDto[];
  filters?: Record<string, any>;
}

export class ReorderAdminTabsDto {
  items: Array<{
    id: string;
    sortOrder: number;
  }>;
}
