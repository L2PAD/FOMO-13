import { API } from "../../config/api";
import { setTokenCookie } from "../../helpers/cookieToken";

export default async (wallet: string): Promise<{ user: any; token: any }> => {
  try {
    const res = await fetch(`${API}/user/initial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ wallet }),
    });

    const { user, token } = await res.json();

    if (token) {
      setTokenCookie(token);
      localStorage.setItem("fomo-token", token);
    }
    user && localStorage.setItem("fomo-user", JSON.stringify(user));

    if (!user && !token) {
      localStorage.removeItem("fomo-user");
    }

    return { user, token };
  } catch (error) {
    console.log(error);

    return { user: "", token: "" };
  }
};
