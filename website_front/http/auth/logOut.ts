import { API } from "../../config/api";
import { deleteTokenCookie } from "../../helpers/cookieToken";

export default (): boolean => {
  try {
    localStorage.removeItem("fomo-token");
    localStorage.removeItem("fomo-user");
    localStorage.removeItem("fomo-auth");

    deleteTokenCookie();
    deleteTokenCookie("temp-tkn");

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
};
