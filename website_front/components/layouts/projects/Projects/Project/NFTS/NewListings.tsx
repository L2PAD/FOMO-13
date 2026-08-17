import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GraphicItemsWrapper, TableItem } from "../styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import {
  CardWrapper,
  GraphicItemData,
  ProjectWrapper,
  TableHeader,
} from "./styles";

interface Item {
  id: number;
  avatar: string;
  event: string;
  name: string;
  price: number;
  maker: string;
  from: string;
  until: string;
}

interface Props {
  cursor: string | undefined;
}

const NewListings = ({ cursor }: Props) => {
  const [nfts, setNfts] = useState<Item[]>([]);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const data = new Array(5).fill("");

    const newNfts: Item[] = data.map(() => ({
      id: 123,
      avatar:
        "https://cs13.pikabu.ru/post_img/big/2023/02/13/8/1676295806122712757.png",
      event: "NFT Event",
      name: "My NFT Project",
      price: 0.5,
      maker: "0x4545f",
      from: "UserA",
      until: "2023-08-02",
    }));

    setNfts(newNfts);
  }, [id, cursor]);

  return (
    <>
      <CardWrapper variant="default">
        <TableHeader>
          <p>Event</p>
          <p>Name</p>
          <p>Price</p>
          <p>Maker</p>
          <p>Valid From</p>
          <p>Valid Until</p>
        </TableHeader>
        <GraphicItemsWrapper>
          {nfts.map((item) => (
            <TableItem key={item.id} href={`/nfts/card/${item.id}`}>
              <ProjectWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={item.avatar}
                  name={item.event}
                />
                <b>{item.event}</b>
              </ProjectWrapper>
              <GraphicItemData variant="default">
                {item.name} ETH
              </GraphicItemData>
              <GraphicItemData variant="default">{item.price}</GraphicItemData>
              <GraphicItemData variant="default">{item.maker}</GraphicItemData>
              <GraphicItemData variant="default">{item.from}</GraphicItemData>
              <GraphicItemData variant="default">{item.until}</GraphicItemData>
            </TableItem>
          ))}
        </GraphicItemsWrapper>
      </CardWrapper>
      {/* {loading && 'loading...'} */}
      {/* {cursor !== null && <ShowAllButton onClick={fetchData}>Load more </ShowAllButton>} */}
    </>
  );
};

export default NewListings;
