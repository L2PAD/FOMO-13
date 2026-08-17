import React, { FC } from "react";
import Button from "../../../../../global/common/Button";
import { CloseIcon } from "../../../../../global/Icons";
import ArrowBackIcon from "../../../../../global/Icons/ArrowBackIcon";
import PaymentMethods from "../../../../../global/common/PaymentMethods";
import InputWithLabel, {
  ErrorContainer,
} from "../../../../../global/common/components_for_modals/input_with_label";
import { InputError } from "../../CreateOwnAsset/styles";
import LottieError from "../../../../../../assets/animations/error.json";
import dynamic from "next/dynamic";
import * as S from "../styles";

const Lottie = dynamic(() => import("../../../../../global/LottieClient/index"), {
  ssr: false,
});

interface FormPanelProps {
  selectedBank: string;
  form: {
    holderName: string;
    iban: string;
    cardNumber: string;
    bankName: string;
  };
  errors: Record<string, string>;
  onClose: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  hasSelected: boolean;
  onSelectBank: (value: string) => void;
  onChangeField: (key: string, value: string) => void;
  formatCardNumber: (value: string) => string;
}

const PaymentMethodsFormPanel: FC<FormPanelProps> = ({
  selectedBank,
  form,
  errors,
  onClose,
  onBack,
  onSubmit,
  onDelete,
  hasSelected,
  onSelectBank,
  onChangeField,
  formatCardNumber,
}) => {
  return (
    <S.Panel>
      <S.PanelHeader>
        <S.IconButton type="button" aria-label="Back" onClick={onBack}>
          <ArrowBackIcon />
        </S.IconButton>
        <S.PanelTitle>Set Payment Method</S.PanelTitle>
        <S.IconButton type="button" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </S.IconButton>
      </S.PanelHeader>

      <S.Form>
        <S.Field>
          <S.Label>Payment Method</S.Label>
          <PaymentMethods
            value={selectedBank}
            onChange={onSelectBank}
            placeholder="Select payment method"
            className="payment-methods-dropdown"
            disabled={hasSelected}
          />
          {errors.type ? (
            <ErrorContainer>
              <Lottie animationData={LottieError} />
              <InputError>{errors.type}</InputError>
            </ErrorContainer>
          ) : (
            <></>
          )}
        </S.Field>

        <S.Field>
          <InputWithLabel
            label="Full Name"
            placeholder="ENTER FULL NAME"
            value={form.holderName}
            onChange={(value) =>
              onChangeField("holderName", String(value).toUpperCase())
            }
            isError={!!errors.holderName}
            errorText={errors.holderName}
            disabled={hasSelected}
          />
        </S.Field>

        <S.Field>
          <InputWithLabel
            label="IBAN"
            placeholder="ENTER IBAN"
            value={form.iban}
            onChange={(value) =>
              onChangeField("iban", String(value).toUpperCase())
            }
            isError={!!errors.iban}
            errorText={errors.iban}
            disabled={hasSelected}
          />
        </S.Field>

        <S.Field>
          <InputWithLabel
            label="Card Number"
            placeholder="0000 0000 0000 0000"
            value={form.cardNumber}
            onChange={(value) =>
              onChangeField("cardNumber", formatCardNumber(String(value)))
            }
            isError={!!errors.cardNumber}
            errorText={errors.cardNumber}
            disabled={hasSelected}
          />
        </S.Field>
        {hasSelected ? (
          <S.PanelFooter className="center">
            <Button
              variant="outlined"
              className="red-btn"
              onClick={onDelete}
            >
              Delete
            </Button>
          </S.PanelFooter>
        )
          :
          <S.PanelFooter className="align-bottom">
            <Button
              variant="main"
              className="primary-btn"
              onClick={onSubmit}
              disabled={Object.values(errors).some(Boolean)}
            >
              Confirm
            </Button>
          </S.PanelFooter>
        }
      </S.Form>
    </S.Panel>
  );
};

export default PaymentMethodsFormPanel;
