import { API } from "../../config/api";

export default async (code: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API}/ref/check/${code}`, {
      method: "POST",
    });

    const isValid = await res.json();

    return isValid;
  } catch (error) {
    console.log(error);

    return false;
  }
};
