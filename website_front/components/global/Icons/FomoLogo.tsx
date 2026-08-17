import React from "react";
import FomoIcon from "../../../assets/images/Main Logo.png";
import styled from "styled-components";
import Image from "next/image";

const Wrapper = styled.div`
  img {
    width: 112px;
    height: 46px;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    img {
      width: 80px;
      height: 36px;
      object-fit: contain;
    }
  }
`;

const FomoLogo = () => {
  return (
    <Wrapper className="fomo-logo">
      <Image src={FomoIcon} alt="FOMO" />
    </Wrapper>
  );
};

export default FomoLogo;
