import React, { useState } from "react";
import Slider from "rc-slider";
import { Button, CardWrapper, DataTitle } from "./styles";
import "rc-slider/assets/index.css";
import Input from "../../../../../global/common/Input";
import Alert from "../../Alert";

interface Props {
  title: string;
  variant: "Buy" | "Sell";
}

const FormCard = ({ title, variant }: Props) => {
  const [show, setShow] = useState(false);
  return (
    <CardWrapper>
      <DataTitle variant="p">{title}</DataTitle>
      <p>
        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint
      </p>
      <Input
        type="text"
        placeholder="Price"
        labelText="Price"
        onChange={() => {}}
        value="0.03 USDT"
        error="Max: 101515 (15.04%)"
      />
      <Input
        type="text"
        placeholder="Quantity"
        labelText="Quantity"
        onChange={() => {}}
        value="15 GRT"
        error="You don’t have enough money"
      />
      <Slider
        trackStyle={{ background: "#04A584", height: 8 }}
        railStyle={{ background: "rgba(39, 122, 210, 0.1)", height: 8 }}
        handleStyle={{
          background: "#04A584",
          marginTop: -8,
          width: 24,
          height: 24,
          borderColor: "#fff",
        }}
      />
      <Input
        type="text"
        placeholder="Total"
        labelText="Total"
        onChange={() => {}}
        value="0 USDT"
      />
      <Button
        variant={variant === "Buy" ? "green" : "red"}
        onClick={() => setShow(true)}
      >
        {variant} GRT
      </Button>
      {show && <Alert onClose={() => setShow(false)} />}
    </CardWrapper>
  );
};

export default FormCard;
