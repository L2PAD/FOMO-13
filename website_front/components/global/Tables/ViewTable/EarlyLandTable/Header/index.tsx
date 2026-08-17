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
      <Investors variant="p">Progress</Investors>
      <ToTalRaised variant="p">Activity Type</ToTalRaised>
      <LastFunding variant="p">Reward</LastFunding>
      <Type variant="p">Type</Type>
      <RedFlags variant="p">Red Flags</RedFlags>
    </HeaderWrapper>
  );
};

export default Header;
