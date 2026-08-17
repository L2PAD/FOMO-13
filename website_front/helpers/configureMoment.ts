import moment from "moment";
import { SUPPORTED_MOMENT_DATE_FORMATS } from "./dateFormats";

(moment as any).createFromInputFallback = (config: any) => {
  const input = config?._i;

  if (typeof input !== "string") {
    config._d = new Date(NaN);
    return;
  }

  const parsedDate = moment(input, SUPPORTED_MOMENT_DATE_FORMATS as any, true);

  if (parsedDate.isValid()) {
    config._d = parsedDate.toDate();
    return;
  }

  const nativeDate = new Date(input);
  config._d = Number.isNaN(nativeDate.getTime()) ? new Date(NaN) : nativeDate;
};

export {};
