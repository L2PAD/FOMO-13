import React from "react";
import UserAvatar from "../../../../../../global/common/UserAvatar";
import { Body, Cell, Header, Wrapper, Row } from "./styles";

const Bids = () => {
  return (
    <Wrapper variant="default">
      <Header>
        <Cell>Price</Cell>
        <Cell>USD price</Cell>
        <Cell>Floor Difference</Cell>
        <Cell>Expiration</Cell>
        <Cell>From</Cell>
      </Header>
      <Body>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              variant="default"
              size="xSmall"
              name="SharkRace Club"
            />
            <span>John Doe</span>
          </Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              variant="default"
              size="xSmall"
              name="SharkRace Club"
            />
            <span>John Doe</span>
          </Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              variant="default"
              size="xSmall"
              name="SharkRace Club"
            />
            <span>John Doe</span>
          </Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              variant="default"
              size="xSmall"
              name="SharkRace Club"
            />
            <span>John Doe</span>
          </Cell>
        </Row>
        <Row>
          <Cell>Transfer</Cell>
          <Cell>10.55 ETH</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>0x4545fvyvv6456c45c2c3c264b</Cell>
          <Cell>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              variant="default"
              size="xSmall"
              name="SharkRace Club"
            />
            <span>John Doe</span>
          </Cell>
        </Row>
      </Body>
    </Wrapper>
  );
};

export default Bids;
