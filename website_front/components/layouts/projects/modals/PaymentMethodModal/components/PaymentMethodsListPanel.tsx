import React, { FC } from "react";
import Button from "../../../../../global/common/Button";
import { ArrowRightIcon } from "../../../../../global/Icons";
import ArrowBackIcon from "../../../../../global/Icons/ArrowBackIcon";
import { PaymentMethod, PaymentMethodType } from "../../../../../../http/deals/paymentMethods";
import { paymentMethodOptions } from "../../CreateP2PDealModal";
import * as S from "../styles";

interface ListPanelProps {
  methods: PaymentMethod[];
  isLoading: boolean;
  onAdd: () => void;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  getBadgeLetter: (type: PaymentMethodType) => string;
  typeLabels: Record<PaymentMethodType, string>;
}

const PaymentMethodsListPanel: FC<ListPanelProps> = ({
  methods,
  isLoading,
  onAdd,
  onClose,
  onSelect,
  getBadgeLetter,
  typeLabels,
}) => {
  return (
    <S.Panel className="list">
      <S.PanelHeader>
        <S.IconButton type="button" aria-label="Back" onClick={onClose}>
          <ArrowBackIcon />
        </S.IconButton>
        <S.PanelTitle>Payment method</S.PanelTitle>
        <S.IconButton
          type="button"
          className={"plus"}
          aria-label="Add"
          onClick={onAdd}
        >
          <S.Plus>+</S.Plus>
        </S.IconButton>
      </S.PanelHeader>

      <S.MethodList>
        {isLoading && <S.EmptyState>Loading...</S.EmptyState>}
        {!isLoading && methods.length === 0 && (
          <S.EmptyState>No payment methods yet.</S.EmptyState>
        )}
        {methods.map((method) => {
          const bankKey = (method.meta?.bankKey as string) || "";
          const icon = paymentMethodOptions.find((opt) => opt.value === bankKey)?.icon;

          return (
          <S.MethodItem key={method._id} onClick={() => onSelect(method)}>
            <S.MethodInfo>
              {icon ? (
                <S.MethodIcon>
                  <img src={icon} alt={method.label} />
                </S.MethodIcon>
              ) : (
                <S.MethodBadge $variant={method.type}>
                  {getBadgeLetter(method.type)}
                </S.MethodBadge>
              )}
              <div>
                <S.MethodTitle>{method.label}</S.MethodTitle>
                <S.MethodSubtitle>{typeLabels[method.type]}</S.MethodSubtitle>
              </div>
            </S.MethodInfo>
            <S.Chevron>
              <ArrowRightIcon />
            </S.Chevron>
          </S.MethodItem>
          );
        })}
      </S.MethodList>

      <S.PanelFooter>
        <Button variant="main" className="primary-btn">
          Save Changes
        </Button>
      </S.PanelFooter>
    </S.Panel>
  );
};

export default PaymentMethodsListPanel;
