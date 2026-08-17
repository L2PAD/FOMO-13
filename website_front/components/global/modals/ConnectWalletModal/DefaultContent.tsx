import React, { FC, useState } from "react";
import Image from "next/image";
import { ArrowRightIcon, MetamaskIcon, WalletIcon } from "../../Icons";
import TrustWalletIcon from "../../Icons/trust-icon.png";
import Checkbox from "../../common/Checkbox";
import { ButtonContentWrapper, ButtonWrapper } from "./styles";

interface Props {
  connectStepsHandler: () => void;
}

const DefaultContent: FC<Props> = ({ connectStepsHandler }) => {
  const [checked, setChecked] = useState(false);

  return (
    <>
      <p>Start by connecting with one of the wallet below</p>
      <ButtonWrapper disabled={!checked} onClick={connectStepsHandler}>
        <ButtonContentWrapper>
          <MetamaskIcon />
          <span>Metamask</span>
        </ButtonContentWrapper>
        <ArrowRightIcon />
      </ButtonWrapper>
      <ButtonWrapper disabled={!checked} onClick={connectStepsHandler}>
        <ButtonContentWrapper>
          <WalletIcon />
          <span>Connect Wallet</span>
        </ButtonContentWrapper>
        <ArrowRightIcon />
      </ButtonWrapper>
      <ButtonWrapper disabled={!checked} onClick={connectStepsHandler}>
        <ButtonContentWrapper>
          <Image src={TrustWalletIcon} alt="'trust-wallet" />
          <span>TrustWallet</span>
        </ButtonContentWrapper>
        <ArrowRightIcon />
      </ButtonWrapper>
      <div className="check-zone">
        <Checkbox
          checked={checked}
          onChange={() => setChecked((prevState) => !prevState)}
        />
        <p>
          I have read, understand and agree to No name Disclaimer as well as
          Terms of Service and Privacy Policy
        </p>
      </div>
    </>
  );
};

export default DefaultContent;
