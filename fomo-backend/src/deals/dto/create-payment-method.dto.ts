import { PaymentMethodType } from "../model/payment-method.model";

export class CreatePaymentMethodDto {
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
