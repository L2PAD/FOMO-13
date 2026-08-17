import React from "react";
import {
  ATHRoi,
  CurrentRoi,
  Funds,
  HeaderWrapper,
  Projects,
  RedFlags,
} from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <Funds variant="p">Funds</Funds>
      <Projects variant="p">Projects</Projects>
      <ATHRoi variant="p">ATH ROI</ATHRoi>
      <CurrentRoi variant="p">Current ROI</CurrentRoi>
      <RedFlags variant="p">Red Flags</RedFlags>
    </HeaderWrapper>
  );
};

export default Header;
