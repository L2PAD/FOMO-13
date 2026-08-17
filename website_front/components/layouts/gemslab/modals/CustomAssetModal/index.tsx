import React, { FC, useState } from "react";
import { CryptoCurrencies } from "../../../../../staticContent/global";
import Modal from "../../../../global/common/Modal";
import {
  BuySellItem,
  BuySellWrapper,
  ContentWrapper,
  DateInput,
  DateInputsWrapper,
  DropdownCurrency,
  InputStyle,
  MarketPriceInputs,
  SubmitButton,
  Title,
} from "./styles";

interface Props {
  onClose: () => void;
}

const CustomAssetModal: FC<Props> = ({ onClose }) => {
  const [assetFor, setAssetFor] = useState(0);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [currency, setCurrency] = useState(CryptoCurrencies[0]);

  return (
    <Modal onClose={onClose} title="Custom asset" variant="small">
      <ContentWrapper>
        <div>
          <Title variant="p">Asset Name</Title>
          <BuySellWrapper>
            <BuySellItem active={assetFor === 0} onClick={() => setAssetFor(0)}>
              Buy
            </BuySellItem>
            <BuySellItem active={assetFor === 1} onClick={() => setAssetFor(1)}>
              Sell
            </BuySellItem>
          </BuySellWrapper>
        </div>
        <div>
          <Title variant="p">Asset Name</Title>
          <InputStyle
            value={name}
            onChange={(value) => setName(value)}
            type="text"
            placeholder="Asset name or ticket"
          />
        </div>
        <div>
          <Title variant="p">Asset Name</Title>
          <InputStyle
            value={amount}
            onChange={(value) => setAmount(value)}
            type="text"
            placeholder="0"
          />
        </div>
        <div>
          <Title variant="p">Market Price</Title>
          <MarketPriceInputs>
            <InputStyle
              value={marketPrice}
              onChange={(value) => setMarketPrice(value)}
              type="text"
              placeholder="0.00"
            />
            <DropdownCurrency
              options={CryptoCurrencies}
              value={currency}
              onChange={(value) => setCurrency(value)}
            />
          </MarketPriceInputs>
        </div>
        <div>
          <Title variant="p">Date and Time</Title>
          <DateInputsWrapper>
            <DateInput
              value={date}
              onChange={(value) => setDate(value)}
              type="text"
              placeholder="DD.MM.YYYY"
            />
            <DateInput
              value={time}
              onChange={(value) => setTime(value)}
              type="text"
              placeholder="HH:MM"
            />
          </DateInputsWrapper>
        </div>
        <div>
          <Title variant="p">Total</Title>
          <InputStyle
            value={totalAmount}
            onChange={(value) => setTotalAmount(value)}
            type="text"
            placeholder="0"
          />
        </div>
        <SubmitButton onClick={onClose}>Add transaction</SubmitButton>
      </ContentWrapper>
    </Modal>
  );
};

export default CustomAssetModal;
