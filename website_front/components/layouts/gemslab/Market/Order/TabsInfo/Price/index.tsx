import React from "react";
import { Wrapper } from "./styles";
import dynamic from "next/dynamic";

// @ts-ignore
const Char = dynamic(() => import("./char.tsx"), { ssr: false });

const Price = () => {
  return (
    <Wrapper variant="default">
      <Char />
    </Wrapper>
  );
};

export default Price;
