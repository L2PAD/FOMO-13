import React, { FC, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IDeal } from "../../../../../types/global_types";
import { DropdownOption } from "../../../../UI/CustomDropdown";
import FundsReservedModal from "./FundsReservedModal";
import SaleCompletedModal from "./SaleCompletedModal";
import ReturnFundsModal from "./ReturnFundsModal";
import CreateP2PDealModal from "./P2PModal";
import { getUserTotalBalance } from "../../../../../smart/smartOTCP2P";
import { UserDealsBalance } from "../../../../global/DealsBalanceComponent";
import { AuthContext } from "../../../../global/Layout";

export const paymentMethodOptions: DropdownOption[] = [
  {
    value: "monobank_card",
    label: "Monobank",
    icon: "https://commons.wikimedia.org/wiki/Special:FilePath/Monobank_logo.svg",
  },
  {
    value: "privatbank_card",
    label: "PrivatBank",
    icon: "https://static.cdnlogo.com/logos/p/52/privat-bank.svg",
  },
  {
    value: "pumb_card",
    label: "PUMB",
    icon: "https://commons.wikimedia.org/wiki/Special:FilePath/Pumb_logo.svg",
  },
  {
    value: "abank_card",
    label: "A-Bank",
    icon: "https://commons.wikimedia.org/wiki/Special:FilePath/Abank_logo.svg",
  },
  {
    value: "raiffeisen",
    label: "Raiffeisen Bank Aval",
    icon: "https://commons.wikimedia.org/wiki/Special:FilePath/Rba-logo-black-eng.svg",
  },
  {
    value: "oschadbank",
    label: "OschadBank",
    icon: "https://commons.wikimedia.org/wiki/Special:FilePath/Oschad_Bank.svg",
  },
  {
    value: "sense_bank",
    label: "Sense Bank",
    icon: "https://commons.wikimedia.org/wiki/Special:FilePath/Sense_bank_logo.svg",
  },
  {
    value: "izibank",
    label: "Izibank",
    icon: "https://images.seeklogo.com/logo-png/39/1/izibank-logo-png_seeklogo-397788.png",
  },
  {
    value: "otp_bank",
    label: "OTP Bank",
    icon: "https://commons.wikimedia.org/wiki/Special:FilePath/OTP_Bank_logo.svg",
  },
];

interface Props {
  isVisible: boolean
  refetchDeals?: any;
  dealDataInitial?: IDeal | null;
  repeatDealInitial?: IDeal | null;
  onClose: () => void;
  onDealCreated?: (amount: string, price: string) => void;
}

const CreateP2PDealModalWithStatus: FC<Props> = (props) => {
  const { userData } = useContext(AuthContext)
  const [balance, setBalance] = useState<UserDealsBalance>({ eth: 0, usdc: 0 })
  const [showFundsReserved, setShowFundsReserved] = useState(false);

  React.useEffect(() => {
    // if (showFundsReserved) {
    //   const timer = setTimeout(() => {
    //     setShowFundsReserved(false);
    //     setShowSaleCompleted(true);
    //   }, 3000);

    //   return () => clearTimeout(timer);
    // }
  }, [showFundsReserved]);

  const handleDealCreated = (amount: string, price: string) => {
    setShowFundsReserved(true);
    props.onClose()
  };

  useEffect(() => {
    if (userData?.wallet) {
      getUserTotalBalance(userData.wallet).then((balance) => {
        setBalance({ eth: balance.eth, usdc: balance.usdc })
      })
    }
  }, [userData])

  return (
    <>
      <CreateP2PDealModal
        {...props}
        balance={balance}
        onClose={() => {
          props.onClose();
        }}
        onDealCreated={handleDealCreated}
      />
    </>
  );
};

export default CreateP2PDealModalWithStatus;
