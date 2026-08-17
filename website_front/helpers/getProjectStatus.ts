import upperCaseFirstLetter from "./upperCaseFirstLetter";
import { STATUS_LIST } from "../types/global_types";

export default (string: string) => {
  const status: string = upperCaseFirstLetter(string || "none");

  switch (status) {
    case "Active":
      return STATUS_LIST.ACTIVE;
    case "Upcoming":
      return STATUS_LIST.UPCOMING;
    case "Ended":
      return STATUS_LIST.ENDED;
    case "New":
      return STATUS_LIST.NEW;
    case "Blocked":
      return STATUS_LIST.BLOCKED;
    default:
      return STATUS_LIST.ACTIVE;
  }
};
