import React, { FC, useState } from "react";
import Link from "next/link";
import {
  CardsTableContent,
  TableHeaderWrapper,
  UpDownPrice,
  UserRowsWrapper,
  UserRowWrapper,
} from "../../Onchain/Tabs/Address/styles";
import UserAvatar from "../../../../global/common/UserAvatar";
import Pagination from "../../../../global/Pagintaion";
import { Wrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const AddressTopEntitiesModal: FC<Props> = ({ onClose }) => {
  const [page, setPage] = useState(1);
  return (
    <Wrapper title="Top entities" variant="medium" onClose={onClose}>
      <br />
      <CardsTableContent>
        <TableHeaderWrapper>
          <div>Asset</div>
          <div>Price</div>
          <div>Holdings</div>
          <div>Value</div>
        </TableHeaderWrapper>
        <UserRowsWrapper>
          {Array(10)
            .fill("")
            .map((item, i) => {
              return (
                <UserRowWrapper key={i + item}>
                  <Link href="/crypto/onchain/123">
                    <UserAvatar
                      size="xSmall"
                      variant="none"
                      avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                      name="name"
                    />
                    <p>Name</p>
                  </Link>
                  <div>
                    <p>$3.39</p>
                    <UpDownPrice value={-0.01}>-$0.01</UpDownPrice>
                  </div>
                  <div>
                    <p>$3.39 ETH</p>
                  </div>
                  <div>
                    <p>$3.39</p>
                    <UpDownPrice value={0.01}>$0.01</UpDownPrice>
                  </div>
                </UserRowWrapper>
              );
            })}
        </UserRowsWrapper>
      </CardsTableContent>
      <Pagination
        page={page}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
    </Wrapper>
  );
};

export default AddressTopEntitiesModal;
