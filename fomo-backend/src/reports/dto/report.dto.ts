export class CreateReportDto {
  userId: string;
  type?: "impersonality" | "inappropriateBehavior" | "underageAccount";
  subType: "me" | "publicFigure" | "someoneIknow";
  body?: string;
  attachment?: string;
}

export class SearchReportDto {
  userId?: string;
  type?: "impersonality" | "inappropriateBehavior" | "underageAccount";
  subType?: "me" | "publicFigure" | "someoneIknow";
  limit?: number;
  page?: number;
}
