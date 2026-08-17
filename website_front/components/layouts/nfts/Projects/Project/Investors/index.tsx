import React, { useState } from "react";
import { PersonsData } from "../../../../../../staticContent/projects/persons";
import {
  InvestorsWrapper,
  PersonCardWrapper,
  ShowAllButton,
  ShowAllWrapper,
  Title,
  Wrapper,
} from "./styles";
import { InvestorsContainer } from "../../../../projects/Crypto/Project/Investors/styles";

const Investors = () => {
  const [showAll, setShowAll] = useState(false);

  return (
    <Wrapper>
      <Title variant="p">Investors</Title>
      <InvestorsContainer>
        <InvestorsWrapper>
          {PersonsData.map((item, i) => {
            if (!showAll) {
              if (i < 5) {
                //@ts-ignore
                return <PersonCardWrapper key={i} {...item} />;
              }
              return null;
            }
            //@ts-ignore
            return <PersonCardWrapper key={i} {...item} />;
          })}
        </InvestorsWrapper>
      </InvestorsContainer>
      <ShowAllWrapper>
        <ShowAllButton onClick={() => setShowAll((state) => !state)}>
          {showAll ? "Hide" : "Show"} all
        </ShowAllButton>
      </ShowAllWrapper>
    </Wrapper>
  );
};

export default Investors;
