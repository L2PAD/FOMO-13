
export class QueryProjectDto {
  status?: string;
  sort?: string;
  offset?: string;
  limit?: string;
  sortKey?: string;
  sortNumberValue?: string;
  readModel?: "v2" | string;
  fallback?: "legacy" | "none" | string;
  lookup?: "coingeckoId" | "slug" | string;
  projectType?: "market" | "echo" | "project" | string;
  marketCapSort?: "Low" | "High";
  searchValue?: string;
  project?:any
  light?: string | boolean;
  includedProjectIds?: string[] | string;
  excludedProjectIds?: string[] | string;
  totalRaised?: { from: number; to: number };
  projectTypes?: Array<"project" | "market">;
  projectValidation?: Array<"active" | "admin" | "moderator">;
  selectedFund?: string;
  additionalStatus?: "sponsored" | "eralash" | string;
  sandbox?: string | boolean;
  change24?: Array<
    "<-50%" |
    "-50%to-10%" |
    "-10%to0%" |
    "0%to+10%" |
    "+10%to+50%" |
    ">+50%"
  >;
  marketCap?: Array<
    "<$1M" |
    "<$10M" |
    "$10M-$100M" |
    "$100M-$1B" |
    ">$1B"
  >;
  volume24h?: Array<
    "<$100K" |
    "$100K-$1M" |
    "$1M-$10M" |
    "$10M-$100M" |
    ">$100M"
  >;
  price?: Array<
    "<$0.01" |
    "$0.01-$0.1" |
    "$0.1-$1" |
    "$1-$10" |
    "$10-$100" |
    ">$100"
  >;
  tradeLaunchDate?: Array<
    "<7days" |
    "<30days" |
    "<90days" |
    "<180days" |
    "<365days" |
    ">365days"
  >;
  categories?:string
  fundsRaised?:string
  fundingType?:any
  section?:'funding-feed'
}
