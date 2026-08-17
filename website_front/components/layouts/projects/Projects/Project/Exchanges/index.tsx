import React, { useState } from "react";
import { ExchangesData } from "../../../../../../staticContent/projects/projects";
import { ShowAllButton, ShowAllWrapper } from "../Investors/styles";
import ViewTable from "../../../../../global/Tables/ViewTable";
import { Wrapper } from "./styles";

const Exchanges = () => {
  const [showAll, setShowAll] = useState(false);

  return (
    <Wrapper>
      <ViewTable
        //@ts-ignore
        type="exchange"
        //@ts-ignore
        cardsData={{
          show: showAll ? 0 : 10,
          cards: ExchangesData.map((item, i) => {
            if (!showAll) {
              if (i < 2) {
                return item;
              }
            }
            return item;
          }),
        }}
      />
      <ShowAllWrapper>
        <ShowAllButton onClick={() => setShowAll((state) => !state)}>
          {showAll ? "Hide" : "Show"} all
        </ShowAllButton>
      </ShowAllWrapper>
    </Wrapper>
  );
};

export default Exchanges;
