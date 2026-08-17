import React from "react";
import { Body, Cell, Header, Row, Wrapper } from "./styles";

const Activity = () => {
  return (
    <Wrapper variant="default">
      <Header>
        <Cell>Event</Cell>
        <Cell>Price</Cell>
        <Cell>From</Cell>
        <Cell>To</Cell>
        <Cell>Date</Cell>
      </Header>
      <Body>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>4 days ago</Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>4 days ago</Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>4 days ago</Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>4 days ago</Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>4 days ago</Cell>
        </Row>
      </Body>
    </Wrapper>
  );
};

export default Activity;
