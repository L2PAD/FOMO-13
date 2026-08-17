import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import BanIcon from "../../../assets/icons/ban.svg";
import {
  Wrapper,
  Head,
  Description,
  AnimationWrapper,
  PageWrapper,
} from "./styles";

const BanAnimationView = dynamic(
  () => import("./BanAnimation.client"),
  { ssr: false }
);

const BanPage = () => {
  return (
    <PageWrapper>
      <Wrapper>
        <Head>
          <Image alt="fomo banned" src={BanIcon} />
          <h1>Your profile is blocked</h1>
        </Head>

        <Description>
          To find out the reasons or to unblock your profile, please contact{" "}
          <a href="/">support</a>
        </Description>
      </Wrapper>

      <AnimationWrapper>
        <BanAnimationView />
      </AnimationWrapper>
    </PageWrapper>
  );
};

export default BanPage;
