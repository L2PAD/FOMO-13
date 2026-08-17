import React from "react";
import "react-h5-audio-player/lib/styles.css";
import { CardsWrapper, TableWrapper } from "./styles";
import Row from "./Row";

const PodcastsTable = () => {
  return (
    <TableWrapper>
      <CardsWrapper>
        {Array(8)
          .fill("")
          .map((item, i) => {
            return <Row key={i + item} />;
          })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default PodcastsTable;
