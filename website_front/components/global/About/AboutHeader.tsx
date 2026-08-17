import React, { useState } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import Image from "next/image";
import logo from "../../../public/static/logo-beta.png";
import Link from "next/link";
import ConnectWalletModal from "../modals/ConnectWalletModal";
import PictureIcon from "../Icons/PictureIcon";
import getUserByToken from "../../../http/user/getUserByToken";
import {
  AboutHeaderWrapper,
  BuyButton,
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
  WalletButton,
} from "./styles";
import FomoLogo from "../Icons/FomoLogo";

const AboutHeader = () => {
  const { data } = useQuery("auth", getUserByToken);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const isAuth: boolean = !!data?.wallet;

  return (
    <AboutHeaderWrapper>
      <Link className="logo" href="/main">
        <FomoLogo />
      </Link>
      <div className="center">
        <div className="links">
          <Link href="/">Main</Link>
          <Link href="/crypto">Crypto</Link>
          <Link href="/earlyland">EarlyLand</Link>
          <Link href="/nfts">NFTs</Link>
          <Link href="/gemslab">GemsLab</Link>
          <Link href="/utility">Utility</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
        <SearchWrapper>
          <SearchInput
            type="text"
            placeholder="Search"
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle />}
            value={searchValue}
          />
        </SearchWrapper>
      </div>
      <div className="buttons">
        {isAuth ? (
          <></>
        ) : (
          <WalletButton
            variant="outlined"
            onClick={() => router.push("/invite")}
          >
            Connect Wallet
          </WalletButton>
        )}
        <BuyButton
          onClick={() => router.push("/?nft=true")}
          variant="secondary"
          className="buy"
        >
          +Buy FOMO NFT
          <PictureIcon />
        </BuyButton>
      </div>
    </AboutHeaderWrapper>
  );
};

export default AboutHeader;
