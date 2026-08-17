import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import MainModal from "../../../../global/common/MainModal";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  PaymentMethod,
  PaymentMethodType,
} from "../../../../../http/deals/paymentMethods";
import { toast } from "react-toastify";
import PaymentMethodsListPanel from "./components/PaymentMethodsListPanel";
import PaymentMethodsFormPanel from "./components/PaymentMethodsFormPanel";
import { INPUT_ERROR_TIME } from "../../../../global/common/components_for_modals/input_with_label";
import { paymentMethodOptions } from "../CreateP2PDealModal";

interface PaymentMethodModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type ViewState = "list" | "form";

const MAX_CARD_DIGITS = 16;

const digitsOnly = (value: string): string => value.replace(/\D/g, "");

const formatCardNumber = (value: string): string => {
  const limited = digitsOnly(value).slice(0, MAX_CARD_DIGITS);
  return limited.replace(/(\d{4})(?=\d)/g, "$1 ");
};

const isLuhnValid = (value: string): boolean => {
  const cardDigits = digitsOnly(value);
  if (cardDigits.length !== MAX_CARD_DIGITS) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardDigits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(cardDigits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const normalizeLabel = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const resolveBankKeyFromLabel = (label: string): string => {
  const normalized = normalizeLabel(label);
  const match = paymentMethodOptions.find(
    (opt) => normalizeLabel(opt.label) === normalized
  );
  return match?.value || label;
};

const PaymentMethodModal: FC<PaymentMethodModalProps> = ({
  isVisible,
  onClose,
}) => {
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [view, setView] = useState<ViewState>("list");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    type: "bank" as PaymentMethodType,
    holderName: "",
    iban: "",
    cardNumber: "",
    bankName: "",
    isDefault: false,
  });
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openForm = (): void => {
    setSelectedMethod(null);
    setForm({
      type: "bank",
      holderName: "",
      iban: "",
      cardNumber: "",
      bankName: "",
      isDefault: false,
    });
    setSelectedBank("");
    setErrors({});
    setView("form");
  };
  const openList = (): void => {
    setView("list");
    setSelectedMethod(null);
    setErrors({});
  };

  const typeLabels: Record<PaymentMethodType, string> = useMemo(
    () => ({
      card: "Card",
      google_pay: "Google Pay",
      apple_pay: "Apple Pay",
      bank: "Bank Transfer",
      other: "Other",
    }),
    []
  );

  const loadMethods = async (): Promise<void> => {
    setIsLoading(true);
    const { isSuccess, methods } = await getPaymentMethods();
    if (isSuccess) {
      setMethods(methods);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isVisible) {
      loadMethods();
      setView("list");
    }
  }, [isVisible]);

  const onSelectMethod = (method: PaymentMethod): void => {
    const bankKey =
      (method.meta?.bankKey as string) || resolveBankKeyFromLabel(method.label);
    const bankLabel =
      paymentMethodOptions.find((opt) => opt.value === bankKey)?.label ||
      method.bankName ||
      method.label ||
      "";
    setSelectedMethod(method);
    setForm({
      type: method.type,
      holderName: method.holderName || "",
      iban: (method.meta?.iban as string) || "",
      cardNumber: method.cardNumber || '',
      bankName: bankLabel,
      isDefault: !!method.isDefault,
    });
    setSelectedBank(bankKey);
    setErrors({});
    setView("form");
  };

  const updateForm = (key: string, value: string | boolean): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getBadgeLetter = (type: PaymentMethodType): string => {
    if (type === "google_pay") return "G";
    if (type === "apple_pay") return "A";
    if (type === "bank") return "B";
    if (type === "other") return "O";
    return "C";
  };

  const buildLabel = (): string => {
    return form.bankName || "Bank";
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!selectedBank) nextErrors.type = "Select payment method.";
    if (!form.holderName.trim()) nextErrors.holderName = "Enter full name.";
    if (!form.iban.trim()) nextErrors.iban = "Enter IBAN.";
    if (!isLuhnValid(form.cardNumber)) {
      nextErrors.cardNumber = "Enter valid card number.";
    }
    if (!form.bankName.trim()) nextErrors.bankName = "Add bank name.";

    setErrors(nextErrors);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrors({});
    }, INPUT_ERROR_TIME);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (): Promise<void> => {
    if (!validateForm()) return;

    const cardDigits = digitsOnly(form.cardNumber);
    const cardLast4 = cardDigits.slice(-4);

    const { isSuccess } = await createPaymentMethod({
      type: form.type,
      label: buildLabel(),
      holderName: form.holderName || undefined,
      bankName: form.bankName || undefined,
      cardLast4: cardLast4 || undefined,
      cardNumber: cardDigits || undefined,
      isDefault: form.isDefault,
      meta: {
        bankKey: selectedBank || undefined,
        iban: form.iban || undefined,
        cardNumber: cardDigits
      },
    });

    if (!isSuccess) {
      toast.error("Failed to save payment method");
      return;
    }

    toast.success("Payment method saved");
    await loadMethods();
    openList();
  };

  const onDelete = async (): Promise<void> => {
    if (!selectedMethod?._id) return;
    const { isSuccess } = await deletePaymentMethod(selectedMethod._id);
    if (!isSuccess) {
      toast.error("Failed to delete payment method");
      return;
    }
    toast.success("Payment method deleted");
    await loadMethods();
    openList();
  };

  return (
    <MainModal
      className="payment-method-modal"
      isVisible={isVisible}
      onClose={onClose}
      title=""
      isTitle={false}
      variant={"cart"}
    >
      {view === "list" && (
        <PaymentMethodsListPanel
          methods={methods}
          isLoading={isLoading}
          onAdd={openForm}
          onClose={onClose}
          onSelect={onSelectMethod}
          getBadgeLetter={getBadgeLetter}
          typeLabels={typeLabels}
        />
      )}

      {view === "form" && (
        <PaymentMethodsFormPanel
          selectedBank={selectedBank}
          form={form}
          errors={errors}
          onClose={onClose}
          onBack={openList}
          onSubmit={onSubmit}
          onDelete={onDelete}
          hasSelected={!!selectedMethod}
          onSelectBank={(value) => {
            const bankLabel =
              paymentMethodOptions.find((opt) => opt.value === value)?.label ||
              value;
            setSelectedBank(value);
            updateForm("bankName", bankLabel);
            updateForm("type", "bank");
          }}
          onChangeField={(key, value) => updateForm(key, value)}
          formatCardNumber={formatCardNumber}
        />
      )}
    </MainModal>
  );
};

export default PaymentMethodModal;
