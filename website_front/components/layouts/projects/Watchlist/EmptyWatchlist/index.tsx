import React, { FC } from "react";
import { TrendingWrapper, Wrapper } from "./styles";
import { useRouter } from "next/router";
import Button from "../../../../global/common/Button";
import upperCaseFirstLetter from "../../../../../helpers/upperCaseFirstLetter";
import TrendingAssets from "../../Crypto/Project/Assets";

interface IProps {
  title: string;
  linkPath: string;
}

const EmptyWatchlist: FC<IProps> = ({ title, linkPath }) => {
  const router = useRouter();

  return (
    <>
      <Wrapper>
        <div className="title">You haven’t added any {title} yet</div>
        <div className="sub-title">
          Keep an eye on promising ventures by adding them to your watchlist!
        </div>
        <Button
          className="watchlist-button"
          variant="main"
          onClick={() => router.push(linkPath)}
        >
          Explore {upperCaseFirstLetter(title)}
        </Button>
      </Wrapper>
      <TrendingWrapper>
        <TrendingAssets />
      </TrendingWrapper>
    </>
  );
};

export default EmptyWatchlist;
