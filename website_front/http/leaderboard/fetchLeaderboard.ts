import { API } from "../../config/api";
import { IActivityLeaderboard, IProject } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getWalletToken from "../getWalletToken";

export default async (
  wallet: string
): Promise<{
  isSuccess: boolean;
  leaderboard: Array<IActivityLeaderboard>;
  userRank: number;
}> => {
  try {
    const accessToken: string | null = getWalletToken();

    const res = await fetch(`${API}/leaderboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    const userRank =
      data.findIndex((item: IActivityLeaderboard) => item.address === wallet) +
      1;

    return { isSuccess: res.status < 300, leaderboard: data, userRank };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, leaderboard: [], userRank: 0 };
  }
};
