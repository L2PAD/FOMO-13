import React from "react";
import { HeaderWrapper } from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <div>№</div>
      <div className="sticky">Pair</div>
      <div>Price</div>
      <div>Exchange Platform</div>
      <div>Volume (24h)</div>
      <div>% Volume</div>
    </HeaderWrapper>
  );
};

export default Header;
