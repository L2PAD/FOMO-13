import { AssetTypes } from "../models/asset.model";

export class CreateAssetDto {
  type: AssetTypes;
  name: string;
  ticker: string;
  amount: number;
  price: number;
  date: Date;
  totalPrice: number;
  fee: number;
  note: string;
  creator:string
  logo?:string | null
  isSelectedAsset?:boolean
}

export class UpdateAssetDto {
  type: AssetTypes;
  name: string;
  ticker: string;
  amount: number;
  price: number;
  date: Date;
  totalPrice: number;
  fee: number;
  note: string;
}
