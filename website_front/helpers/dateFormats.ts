import moment from "moment";

export const SUPPORTED_MOMENT_DATE_FORMATS = [
  moment.ISO_8601,
  moment.RFC_2822,
  "DD.MM.YYYY HH:mm",
  "DD.MM.YYYY",
  "MM/DD/YYYY HH:mm",
  "MM/DD/YYYY",
  "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ",
  "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ [(]GMT[)]",
];
