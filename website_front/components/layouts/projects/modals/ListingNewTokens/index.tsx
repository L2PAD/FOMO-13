import React, { ChangeEvent, FC, useMemo, useState } from "react";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import {
  FlexWrapper,
  DateWrapper,
  EndWrapper,
  SelectWrapper,
  SubmitButton,
  ThemeWrapper,
  DateRow,
  ButtonsWrapper,
} from "./styles";
import { ICreateDeal, IDeal } from "../../../../../types/global_types";
import addDateAndTime from "../../../../../helpers/addDateAndTime";
import TimeInput from "../../../../global/timeInput/TimeInput";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import ModalDatePicker from "../../../../global/common/components_for_modals/modal_date_picker";
import createDeal from "../../../../../http/otc/createDeal";
import { toast } from "react-toastify";
import moment from "moment";

interface Props {
  isOffer?: boolean;
  dealDataInitial?: IDeal;
  refetchDeals?: any;
  onClose: () => void;
}

const ListingNewTokens: FC<Props> = ({
  onClose,
  dealDataInitial,
  isOffer,
  refetchDeals,
}) => {
  const [time, setTime] = useState<any>(
    dealDataInitial
      ? {
          hours: new Date(dealDataInitial?.date || new Date()).getHours(),
          minutes: new Date(dealDataInitial?.date || new Date()).getMinutes(),
        }
      : {}
  );
  const [newDeal, setNewDeal] = useState<ICreateDeal>({
    name: "",
    type: "buy",
    tokenAddress: "",
    ticker: "eth",
    price: 0,
    amount: 0,
    date: new Date(),
    description: "",
    dealId: -1,
    creator: "",
  });

  const inputsHandler = (value: any, name: string): void => {
    setNewDeal((prev: ICreateDeal) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const confirmCreateDeal = async (): Promise<void> => {
    const dealDate: number = new Date(
      addDateAndTime(
        newDeal.date,
        `${time.hours || "00"}:${time.minutes || "00"}`
      )
    ).getTime();

    let deals: Array<any> = [];

    if(!newDeal.ticker) return;

    // if (newDeal.type === "sell") {
    //   newDeal.ticker.toLowerCase() === "eth"
    //     ? await createItem(
    //         dealDate / 1000,
    //         newDeal.amount,
    //         newDeal.tokenAddress || "",
    //         newDeal.price
    //       )
    //     : await createItemUsd(
    //         dealDate / 1000,
    //         newDeal.amount,
    //         newDeal.tokenAddress || "",
    //         newDeal.price
    //       );

    //   deals =
    //     newDeal.ticker.toLowerCase() === "eth"
    //       ? await getAllAvailableItems()
    //       : await getAllAvailableItemsUsd();
    // }

    const dealId: number = deals.length + 1;

    const { isSuccess } = await createDeal(
      {
        ...newDeal,
        ticker: newDeal.ticker.toLowerCase() === "eth" ? "eth" : "usd",
        date: new Date(dealDate),
        movingTokens: false,
        dealId,
        section: "p2p",
      },
      !!isOffer,
      dealDataInitial?._id || ""
    );

    if (isSuccess) {
      refetchDeals && (await refetchDeals());
      toast.success(
        isOffer ? (
          <div>
            <h3>Your offer has been sent!</h3>
            <p>Wait for confirmation from the buyer</p>
          </div>
        ) : (
          <div>
            <h3>Success!</h3>
            <p>Deal created!</p>
          </div>
        )
      );
    }

    onClose();
  };

  const isValid: boolean = useMemo(() => {
    if (
      !newDeal.price ||
      !newDeal.amount ||
      !newDeal.name ||
      !newDeal.tokenAddress
    )
      return false;

    return true;
  }, [newDeal]);

  return (
    <Modal onClose={onClose} title="Initiative new swap">
      <ButtonsWrapper>
        <ButtonSwitch
          className="deal-switch"
          checked={newDeal.type === "sell"}
          leftLabel="BUY"
          rightLabel="SELL"
          onChange={(checked: boolean) =>
            inputsHandler(checked ? "sell" : "buy", "type")
          }
        />
      </ButtonsWrapper>
      <br />
      <ThemeWrapper>
        <p>Smart-contract address</p>
        <input
          value={newDeal.tokenAddress}
          onChange={(e: any) => inputsHandler(e.target.value, "tokenAddress")}
          type="text"
          placeholder="Enter smart contract address"
        />
      </ThemeWrapper>
      {/* <ThemeWrapper>
        <p>Your tokens</p>
        <input type="text" placeholder="Select the desired token" />
      </ThemeWrapper> */}
      <FlexWrapper>
        <ThemeWrapper>
          <p>Amount</p>
          <input
            value={newDeal.amount}
            onChange={(e: any) => inputsHandler(e.target.value, "amount")}
            type="number"
            placeholder="0"
          />
        </ThemeWrapper>
        {/* <Checkbox
          checked={checkAll}
          onChange={() => setCheckAll((prev) => !prev)}
          label="ALL"
        /> */}
      </FlexWrapper>
      <SelectWrapper>
        <p>Your price</p>
        <div>
          <input
            value={newDeal.price}
            onChange={(e: any) => inputsHandler(e.target.value, "price")}
            type="number"
            placeholder="0.00"
          />
          <select
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              inputsHandler(e.target.value.toLowerCase(), "ticker")
            }
          >
            <option>ETH</option>
            <option>USD</option>
          </select>
        </div>
      </SelectWrapper>
      <ThemeWrapper>
        <p>Object</p>
        <input
          value={newDeal.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            inputsHandler(e.target.value, "name")
          }
          type="text"
          placeholder="Object of the deal: nft wl, tokens, etc"
        />
      </ThemeWrapper>
      <ThemeWrapper>
        <p>Description</p>
        <textarea
          value={newDeal.description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            inputsHandler(e.target.value, "description")
          }
          placeholder="Description of deal"
        />
      </ThemeWrapper>
      <DateRow>
        <DateWrapper>
          <p>Duration</p>
          <div>
            <ModalDatePicker
              type="small"
              date={newDeal.date}
              onChange={(value: any) => inputsHandler(value, "date")}
            />
          </div>
        </DateWrapper>
        <TimeInput
          initial={time}
          handler={(name: string, value: string) =>
            setTime((prev: any) => {
              return { ...prev, [name]: value };
            })
          }
        />
      </DateRow>

      <br />
      <SubmitButton disabled={!isValid} onClick={confirmCreateDeal}>
        Create deal
      </SubmitButton>
    </Modal>
  );
};

export default ListingNewTokens;
