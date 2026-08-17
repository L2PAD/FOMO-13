import React from "react";
import {
  HeaderWrapper,
  Investors,
  LastFunding,
  Projects,
  RedFlags,
  Status,
  Tag,
  ToTalRaised,
  Type,
} from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <Projects variant="p">Project</Projects>
      <Status variant="p">Status</Status>
      <Investors variant="p">Investors</Investors>
      <ToTalRaised variant="p">Floor price</ToTalRaised>
      <LastFunding variant="p">Items</LastFunding>
      <Type variant="p">Type</Type>
      <Tag>Owners</Tag>
      <RedFlags variant="p">Red Flags</RedFlags>
    </HeaderWrapper>
  );
};

export default Header;
