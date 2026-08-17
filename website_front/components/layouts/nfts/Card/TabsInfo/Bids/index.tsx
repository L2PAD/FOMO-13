import React, { useState } from "react";
import { OptionsForSortProjectsPage } from "../../../../../../staticContent/global";
import { Header, Wrapper, DropdownWrapper, RowValue, Row } from "./styles";

const Bids = () => {
  const [sortValue, setSortValue] = useState(OptionsForSortProjectsPage[0]);

  return (
    <Wrapper variant="default">
      <Header>
        <DropdownWrapper
          label="Sort by"
          onChange={setSortValue}
          value={sortValue}
          options={OptionsForSortProjectsPage}
        />
      </Header>
      <div>
        <Row>
          <RowValue variant="p">
            <span>20.001 ETH</span> 29% below floor
            <br />
            By <i>B4debf</i> Expiry: im 1 minute
          </RowValue>
        </Row>
        <Row>
          <RowValue variant="p">
            <span>20.001 ETH</span> 29% below floor
            <br />
            By <i>B4debf</i> Expiry: im 1 minute
          </RowValue>
        </Row>
        <Row>
          <RowValue variant="p">
            <span>20.001 ETH</span> 29% below floor
            <br />
            By <i>B4debf</i> Expiry: im 1 minute
          </RowValue>
        </Row>
        <Row>
          <RowValue variant="p">
            <span>20.001 ETH</span> 29% below floor
            <br />
            By <i>B4debf</i> Expiry: im 1 minute
          </RowValue>
        </Row>
      </div>
    </Wrapper>
  );
};

export default Bids;
