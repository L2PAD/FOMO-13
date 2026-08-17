import React from "react";
import {
  Asset,
  HeaderWrapper,
  Last,
  Numeration,
  Public,
  Seed,
  Stage,
  Supply,
  Upcoming,
} from "./styles";

const Header = () => {
  return (
    <HeaderWrapper>
      <Numeration variant="p">#</Numeration>
      <Asset variant="p">Asset</Asset>
      <Supply variant="p">Price</Supply>
      <Public variant="p">Token supply</Public>
      <Seed variant="p">Public vesting</Seed>
      <Stage variant="p">Stage</Stage>
      <Upcoming variant="p">Upcoming event</Upcoming>
      <Last variant="p">Last event</Last>
    </HeaderWrapper>
  );
};

export default Header;
