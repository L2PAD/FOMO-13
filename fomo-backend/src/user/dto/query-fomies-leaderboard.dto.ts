export class QueryFomiesLeaderboardDto {
  range?: "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";
  sortBy?: "ROI" | "XP";
  search?: string;
  offset?: string;
  limit?: string;
}
