export class QueryPersonDto {
  offset?: string;
  limit?: string;
  additionalStatus?: "sponsored" | "eralash" | string;

  specialization?: string[];

  regionData?: any;

  roi?: string[];

  totalInvestments?: string[];

  fomoScore?: string[];

  redFlags?: string[];

  followers?: string[];

  region?:string[]

  sortBy?:string
}


export class QueryFomiesDto {
  type?:"fomies" | string | undefined
}
