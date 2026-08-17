export class FundraisingDto {
  icon: "selected" | "privateSell" | "hourGlass";
  type?: string;
  startDate?: Date;
  endDate?: Date;
  goal?: number;
  raised?: number;
  investors: Array<any>;
  tokenPrice: number;
  tokenSold: number;
  totalSupply: number;
  preValuation: number;
  platformName: string;
  platformImg: string;
  distributionType: string;
  minInvestment?: number;
  maxInvestment?: number;
  usdRoi: number;
  btcRoi: number;
  ethRoi: number;
  athRoi: number;
  currenciesList: Array<any>;
  tokenAllocated?: number;
  unlockDate?: Date;
}
