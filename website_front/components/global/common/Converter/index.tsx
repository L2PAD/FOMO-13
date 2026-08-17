import React, { FC, useEffect, useState } from "react";
import Image from "next/image";
import usaLogo from "../../../../assets/images/usa-logo.png";
import btcLogo from "../../../../assets/images/btc-logo.png";
import { Item, Project, Value, Wrapper } from "./styles";
import imageLoader from "../../../../helpers/imageLoader";
import CustomNumberInput from "../components_for_modals/custom_number_input";

interface IProps {
  logo: string;
  name: string;
  priceUsd?: number;
  priceBtc?: number;
}

const Converter: FC<IProps> = ({ logo, name, priceUsd = 0, priceBtc = 0 }) => {
  const tokenPriceUsd = Number(priceUsd) || 0;
  const tokenPriceBtc = Number(priceBtc) || 0;
  const [tokenAmount, setTokenAmount] = useState<number>(1);
  const [usdAmount, setUsdAmount] = useState<number>(tokenPriceUsd);
  const [btcAmount, setBtcAmount] = useState<number>(tokenPriceBtc);

  useEffect(() => {
    setTokenAmount(1);
    setUsdAmount(tokenPriceUsd);
    setBtcAmount(tokenPriceBtc);
  }, [tokenPriceUsd, tokenPriceBtc]);

  const handleTokenChange = (value: number) => {
    setTokenAmount(value);
    setUsdAmount(value * tokenPriceUsd);
    setBtcAmount(value * tokenPriceBtc);
  };

  const handleUsdChange = (value: number) => {
    setUsdAmount(value);
    const nextTokenAmount = tokenPriceUsd === 0 ? 0 : value / tokenPriceUsd;
    setTokenAmount(nextTokenAmount);
    setBtcAmount(nextTokenAmount * tokenPriceBtc);
  };

  const handleBtcChange = (value: number) => {
    setBtcAmount(value);
    const nextTokenAmount = tokenPriceBtc === 0 ? 0 : value / tokenPriceBtc;
    setTokenAmount(nextTokenAmount);
    setUsdAmount(nextTokenAmount * tokenPriceUsd);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | number,
    type: "token" | "usd" | "btc"
  ) => {
    const value = typeof e === "number" ? e : parseFloat(e.target.value);
    if (Number.isNaN(value)) return;

    if (type === "token") handleTokenChange(value);
    if (type === "usd") handleUsdChange(value);
    if (type === "btc") handleBtcChange(value);
  };

  return (
    <Wrapper variant="main">
      <Item>
        <Project>
          <img src={imageLoader(logo)} alt={name} />
          <span>{name}</span>
        </Project>
        <Value>
          <CustomNumberInput
            placeholder="0.0"
            value={tokenAmount}
            onChange={(val: number) => handleInputChange(val, "token")}
          />
        </Value>
      </Item>
      <Item>
        <Project>
          <Image src={usaLogo} alt="usd" />
          <span>USD</span>
        </Project>
        <Value>
          <CustomNumberInput
            placeholder="0.0"
            value={usdAmount}
            onChange={(val: number) => handleInputChange(val, "usd")}
          />
        </Value>
      </Item>
      <Item>
        <Project>
          <Image src={btcLogo} alt="btc" />
          <span>BTC</span>
        </Project>
        <Value>
          <CustomNumberInput
            placeholder="0.0"
            value={btcAmount}
            onChange={(val: number) => handleInputChange(val, "btc")}
            maxDecimals={8}
          />
        </Value>
      </Item>
    </Wrapper>
  );
};

export default Converter;
