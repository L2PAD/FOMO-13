import React from "react";
import Vector1 from "../../../assets/images/Vector (1).png";
import Vector2 from "../../../assets/images/Vector (2).png";
import FomoIcon from "../../../assets/images/page-not-ready.png";
import {
  CheckboxWrapper,
  EmailHeader,
  EmailWrapper,
  InfoWrapper,
  InputWrapper,
  LabelWrapper,
  VectorOneWrapper,
  VectorTwoWrapper,
  Wrapper,
} from "./styles";
import Image from "next/image";
import Checkbox from "../common/Checkbox";

const PageNotReady = () => {
  return (
    <Wrapper>
      <InfoWrapper>
        <VectorOneWrapper>
          <Image src={Vector2} alt="vector" />
        </VectorOneWrapper>
        <h2>Oops!</h2>
        <div>Not ready yet</div>
        <p>But it’s going to be worth the wait!</p>
        <EmailWrapper>
          <EmailHeader>Notify me when this page is live!</EmailHeader>
          <InputWrapper>
            <input placeholder="Enter email" />
            <button>Get Notified</button>
          </InputWrapper>
          <CheckboxWrapper>
            <Checkbox checked onChange={() => console.log("test")} />
            <LabelWrapper>
              <span>I agree with the</span>
              <a href="#">Privacy Policy</a>
            </LabelWrapper>
          </CheckboxWrapper>
        </EmailWrapper>
      </InfoWrapper>
      <VectorTwoWrapper>
        <Image className="fomo-icon" src={FomoIcon} alt="FOMO" />
      </VectorTwoWrapper>
    </Wrapper>
  );
};

export default PageNotReady;
