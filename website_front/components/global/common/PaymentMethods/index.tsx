import React, { FC } from "react";
import CustomDropdown from "../../../UI/CustomDropdown";
import { paymentMethodOptions } from "../../../layouts/projects/OTC";

interface Props {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PaymentMethods: FC<Props> = ({
  value,
  onChange,
  placeholder = "Select payment method",
  className,
  disabled = false,
}) => {
  return (
    <div style={disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}>
      <CustomDropdown
        options={paymentMethodOptions}
        value={value}
        onChange={(val) => onChange(val as string)}
        placeholder={placeholder}
        multiSelect={false}
        searchable={true}
        showIcons={true}
        className={className}
        isShowSuccess={false}
      />
    </div>
  );
};

export default PaymentMethods;
