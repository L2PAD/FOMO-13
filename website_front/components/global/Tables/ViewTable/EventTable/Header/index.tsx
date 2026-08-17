import React from "react";
import { Asset, HeaderWrapper, Private, Public, Seed, Supply } from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <Asset variant="p">Project</Asset>
      <Supply variant="p">Status</Supply>
      <Public variant="p">Event</Public>
      <Seed variant="p">Date and time</Seed>
      <Private variant="p">Time left</Private>
    </HeaderWrapper>
  );
};

export default Header;
