import * as fs from "fs";
import * as path from "path";

const configuredUploadsDir =
  process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() ||
  process.env.UPLOAD_DIR?.trim() ||
  path.join(process.cwd(), "uploads");

export const UPLOADS_DIR = path.resolve(configuredUploadsDir);

export const ensureUploadsDir = (): string => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  return UPLOADS_DIR;
};
