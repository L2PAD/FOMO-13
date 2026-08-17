import React, { useState } from "react";
import Link from "next/link";
import { PersonsData } from "../../../../../../staticContent/projects/persons";
import {
  InvestorsWrapper,
  PersonCardWrapper,
  ShowAllButton,
  ShowAllWrapper,
  Title,
  Wrapper,
} from "./styles";

const Investors = () => {
  const [showAll, setShowAll] = useState(false);

  return (
    <Wrapper>
      <Title variant="p">Investors</Title>
      <InvestorsWrapper>
        {PersonsData.map((item, i) => {
          if (!showAll) {
            if (i < 5) {
              return (
                <Link href="/crypto/persons/123" key={i}>
                  {/*//@ts-ignore*/}
                  <PersonCardWrapper {...item} />
                </Link>
              );
            }
            return null;
          }
          return (
            <Link href="/crypto/persons/123" key={i}>
              {/*//@ts-ignore*/}
              <PersonCardWrapper {...item} />
            </Link>
          );
        })}
      </InvestorsWrapper>
      <ShowAllWrapper>
        <ShowAllButton onClick={() => setShowAll((state) => !state)}>
          {showAll ? "Hide" : "Show"} all
        </ShowAllButton>
      </ShowAllWrapper>
    </Wrapper>
  );
};
export default Investors;
