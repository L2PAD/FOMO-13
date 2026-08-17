export class GetTokenUnlocksDto {
  search?: string;
  platform?: string;
  source?: string;
  category?: string;
  status?: 'upcoming' | 'past' | 'all';
  days?: number;
  minValueUsd?: number;
  small_unlocks?: string | boolean;
  smallUnlocks?: string | boolean;
  readModel?: "legacy" | "v2" | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
