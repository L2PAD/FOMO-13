import React from "react";
import {
  HeaderWrapper,
  Investors,
  LastFunding,
  Projects,
  RedFlags,
  Status,
  ToTalRaised,
  Type,
} from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <Projects variant="p">Project</Projects>
      <Status variant="p">Status</Status>
      <Investors variant="p">Investors</Investors>
      <ToTalRaised variant="p">Total Raised</ToTalRaised>
      <LastFunding variant="p">Last Funding</LastFunding>
      <Type variant="p">Type</Type>
      <RedFlags variant="p">Red Flags</RedFlags>
    </HeaderWrapper>
  );
};

export default Header;
