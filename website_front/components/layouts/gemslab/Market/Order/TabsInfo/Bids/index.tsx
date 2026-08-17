import React, { FC } from "react";
import Typography from "../../../../../../global/common/Typography";
import { IOrder } from "../../../../../../../types/global_types";
import sliceAddress from "../../../../../../../helpers/sliceAddress";
import { getOrderExpiryMessage } from "../../../../../../../helpers/getOrderExpiry";
import Button from "../../../../../../global/common/Button";
import {
  BidsItem,
  CardWrapper,
  Colored,
  ConfirmOrder,
  GraphicItemsWrapper,
  TableHeader,
  TableItem,
} from "./styles";

interface IProps {
  isOwner: boolean;
  orders: Array<IOrder>;
  confirmOrder: (order: IOrder) => Promise<void>;
}

const Bids: FC<IProps> = ({ orders, isOwner, confirmOrder }) => {
  return (
    <CardWrapper variant="default">
      <TableHeader>
        <p>
          Sort by:
          <Colored variant="default">
            <b>Date</b>
            <small>➤</small>
          </Colored>
        </p>
      </TableHeader>
      <GraphicItemsWrapper>
        {orders.map((item: IOrder) => {
          const now = new Date();
          const isEnded: boolean = new Date(item.endDate) < now;

          return (
            <TableItem count={2} key={item._id}>
              <BidsItem>
                <Typography variant="p">
                  <b>{item.price} {item.isUsdc ? "USDC" : "ETH"}</b>
                  <Colored variant="gray">
                    {Math.ceil(item.belowFloor)}% below floor
                  </Colored>
                </Typography>
                <Typography variant="p">
                  <Colored variant="gray">By</Colored>
                  <b>
                    {item?.user?.wallet ? sliceAddress(item.user.wallet) : "-"}
                  </b>
                  {item.isConfirm ? (
                    <Colored variant="gray">
                      Confirmed{item.smartOrderId ? ` #${item.smartOrderId}` : ""}
                    </Colored>
                  ) : (
                    <Colored variant="gray">
                      {getOrderExpiryMessage(new Date(item.endDate))}
                    </Colored>
                  )}
                </Typography>
              </BidsItem>
              {!isEnded && isOwner ? (
                <ConfirmOrder>
                  <Button
                    disabled={item.isConfirm}
                    onClick={() => confirmOrder(item)}
                    variant="outlined"
                  >
                    {item.isConfirm ? "Confirmed" : "Confirm"}
                  </Button>
                </ConfirmOrder>
              ) : (
                <></>
              )}
            </TableItem>
          );
        })}
      </GraphicItemsWrapper>
    </CardWrapper>
  );
};

export default Bids;
