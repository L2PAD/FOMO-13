import { API } from "../../config/api";
import { FAQItem } from "../../types/global_types";

export default async (): Promise<{
  isSuccess: boolean;
  faq: Array<FAQItem>;
}> => {
  try {
    const res = await fetch(`${API}/faq`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, faq: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, faq: [] };
  }
};
