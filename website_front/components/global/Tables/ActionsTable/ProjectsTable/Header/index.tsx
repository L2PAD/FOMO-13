import React from "react";
import {
  HeaderWrapper,
  Investors,
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
      <ToTalRaised variant="p">Followers</ToTalRaised>
      <Type variant="p">SM Score</Type>
      <RedFlags variant="p">Red Flags</RedFlags>
    </HeaderWrapper>
  );
};

export default Header;
