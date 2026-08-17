import React from "react";
import {
  HeaderWrapper,
  Investors,
  LastFunding,
  Projects,
  Status,
  ToTalRaised,
} from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <Projects variant="p">Pool</Projects>
      <Status variant="p">Amount Staked</Status>
      <Investors variant="p">Lock Date</Investors>
      <ToTalRaised variant="p">Unlock Date</ToTalRaised>
      <LastFunding variant="p">Action</LastFunding>
    </HeaderWrapper>
  );
};

export default Header;
