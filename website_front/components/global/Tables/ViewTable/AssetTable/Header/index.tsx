import React from "react";
import {
  Asset,
  HeaderWrapper,
  Last,
  Private,
  Public,
  Seed,
  Stage,
  Strategic,
  Supply,
  Upcoming,
} from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <Asset variant="p">Asset</Asset>
      <Supply variant="p">Token supply</Supply>
      <Public variant="p">Public vesting</Public>
      <Seed variant="p">Seed vesting</Seed>
      <Private variant="p">Private vesting</Private>
      <Strategic variant="p">Strategic vesting</Strategic>
      <Stage variant="p">Stage</Stage>
      <Upcoming variant="p">Upcoming event</Upcoming>
      <Last variant="p">Last event</Last>
    </HeaderWrapper>
  );
};

export default Header;
