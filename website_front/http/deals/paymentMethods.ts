import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export type PaymentMethodType =
  | "card"
  | "google_pay"
  | "apple_pay"
  | "bank"
  | "other";

export interface PaymentMethod {
  _id: string;
  userId: string;
  type: PaymentMethodType;
  label: string;
  holderName?: string;
  bankName?: string;
  cardLast4?: string;
  cardNumber?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
  meta?: Record<string, any>;
  createdAt: Date;
}

export interface CreatePaymentMethodDto {
  type: PaymentMethodType;
  label: string;
  holderName?: string;
  bankName?: string;
  cardLast4?: string;
  cardNumber?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
  meta?: Record<string, any>;
}

export const getPaymentMethods = async (): Promise<{
  isSuccess: boolean;
  methods: PaymentMethod[];
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    if (!accessToken) {
      return { isSuccess: false, methods: [] };
    }

    const res = await fetch(`${API}/deals/payment-methods`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, methods: data || [] };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, methods: [] };
  }
};

export const createPaymentMethod = async (
  dto: CreatePaymentMethodDto
): Promise<{ isSuccess: boolean; method: PaymentMethod | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    if (!accessToken) {
      return { isSuccess: false, method: null };
    }

    const res = await fetch(`${API}/deals/payment-methods`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, method: data };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, method: null };
  }
};

export const deletePaymentMethod = async (
  id: string
): Promise<{ isSuccess: boolean }> => {
  try {
    const accessToken: string | null = getAuthToken();

    if (!accessToken) {
      return { isSuccess: false };
    }

    const res = await fetch(`${API}/deals/payment-methods/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return { isSuccess: res.status < 300 };
  } catch (error) {
    console.log(error);
    return { isSuccess: false };
  }
};
