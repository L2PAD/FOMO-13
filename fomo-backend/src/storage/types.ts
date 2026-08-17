export type AssetStorageDriverName = "local" | "r2";

export interface StoredAsset {
  key: string;
  url: string;
  mimeType?: string;
  size?: number;
  driver: AssetStorageDriverName;
}

export interface AssetWriteParams {
  buffer: Buffer;
  originalName: string;
  key?: string;
  folder?: string;
  mimeType?: string;
}

export interface AssetStorageDriver {
  writeFile(params: AssetWriteParams): Promise<StoredAsset> | StoredAsset;
  removeFile?(keyOrUrl: string): Promise<void> | void;
}
