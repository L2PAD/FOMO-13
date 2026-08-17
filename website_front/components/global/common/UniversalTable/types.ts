export interface ISortHeaderItem {
  label: string;
  type?: "div" | "link";
  textAlign?: "default" | "right" | "center";
}

export interface ICustomTableColumn {
  key: string;
  label?: string;
  name?: string;
}

export type TableTypes =
  | "crypto"
  | "funding-feed"
  | "backers-funds"
  | "funds"
  | "persons"
  | "unlocking"
  | "projects-ico"
  | "recently"
  | "gainers"
  | "trending"
  | "accumulation"
  | "refs"
  | "custom"
  | "deals"
  | "fomonauts"
  | "orders"
  | "otc"
  | "connections"
  | "onchain-transfers"
  | "influence-relations"
  | "influence-linkedin"
  | "influence-threads"
  | "influence-x"
  | "influence-telegram"
  | "influence-discord"
  | "influence-instagram"
  | "influence-tiktok";
