import moment from "moment";
import { SUPPORTED_MOMENT_DATE_FORMATS } from "./dateFormats";

export const clarifyDate = (
  date?: string | Date | moment.Moment | null
) => {
  if (!date) return "Invalid date";

  if (moment.isMoment(date)) {
    return date.isValid() ? date.clone().format("MMM D, YYYY") : "Invalid date";
  }

  if (date instanceof Date) {
    return moment(date).format("MMM D, YYYY");
  }

  const parsedDate = moment(date, SUPPORTED_MOMENT_DATE_FORMATS as any, true);

  if (parsedDate.isValid()) {
    return parsedDate.format("MMM D, YYYY");
  }

  const fallbackDate = new Date(date);

  if (!Number.isNaN(fallbackDate.getTime())) {
    return moment(fallbackDate).format("MMM D, YYYY");
  }

  return "Invalid date";
};
