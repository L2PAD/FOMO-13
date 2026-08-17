import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

// G7: Add a FOMO (Team) Task to the personal board as a REFERENCE card.
// The backend enforces Prime access and creates a reference (sourceType=FOMO_TASK),
// never a clone — XP/verification/reward stay owned by the canonical task.
export default async (
  taskId: string
): Promise<{ isSuccess: boolean; message?: string }> => {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(
      `${API}/crypto-activities/board/tasks/from-fomo/${taskId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const data = await res.json().catch(() => ({}));
    return {
      isSuccess: res.status < 300,
      message: data?.message,
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false };
  }
};
