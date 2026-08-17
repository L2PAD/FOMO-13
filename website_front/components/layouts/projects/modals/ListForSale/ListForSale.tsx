import React, { useMemo, useState, useEffect, FC, useContext } from "react";
import { useDispatch } from "react-redux";
import { numberToBigNumber } from "../../../../../smart/initialSmartMain";
import {
  approveNFT,
  createOrder,
  createOrderUsd,
  ETH_DECIMALS,
  getCurrentMarketDecimal,
  getOrderByNftId,
  getOrderUsdByNftId,
  getUserNfts,
  USDC_DECIMALS,
} from "../../../../../smart/initialSmartMarketplace";
import addDateAndTime from "../../../../../helpers/addDateAndTime";
import Image from "next/image";
import Modal from "../../../../global/common/Modal";
import ApproveCollection from "./ApproveCollection";
import Button from "../../../../global/common/Button";
import Checkbox from "../../../../global/common/Checkbox";
import TimeInput from "../../../../global/timeInput/TimeInput";
import SearchList from "./searchList/SearchList";
import arrowIcon from "../../../../../assets/icons/arrow.svg";
import {
  ICollection,
  ICreateCollectionNft,
} from "../../../../../types/global_types";
import { AuthContext, LoadingContext } from "../../../../global/Layout";
import ModalDatePicker from "../../../../global/common/components_for_modals/modal_date_picker";
import addListNft from "../../../../../http/collections/addListNft";
import fetchNftFloorPrice from "../../../../../http/collections/fetchNftFloorPrice";
import { toast } from "react-toastify";
import * as S from "./styles";
import { RotateCcw } from "lucide-react";

// Функция для форматирования времени
const formatTimeInput = (value: string): string => {
  // Проверяем, содержит ли ввод двоеточие
  if (value.includes(":")) {
    const [hours, minutes] = value.split(":");

    // Валидация часов (0-23)
    let validHours = hours.replace(/[^\d]/g, "");
    if (validHours.length > 0 && parseInt(validHours) > 23) {
      validHours = "23";
    }
    validHours = validHours.padStart(2, "0").substring(0, 2);

    // Валидация минут (0-59)
    let validMinutes = minutes ? minutes.replace(/[^\d]/g, "") : "";
    if (validMinutes.length > 0 && parseInt(validMinutes) > 59) {
      validMinutes = "59";
    }
    validMinutes = validMinutes.padStart(2, "0").substring(0, 2);

    return `${validHours}:${validMinutes}`;
  }

  // Обрабатываем ввод без двоеточия
  const digits = value.replace(/[^\d]/g, "");

  if (digits.length <= 2) {
    // Если пользователь вводит только часы
    let validHours = digits;
    if (digits.length === 2 && parseInt(digits) > 23) {
      validHours = "23";
    }
    return validHours;
  } else {
    // Если пользователь вводит часы и минуты
    const hours = digits.substring(0, 2);
    let validHours = parseInt(hours) > 23 ? "23" : hours;

    let minutesDigits = digits.substring(2);
    if (minutesDigits.length > 0 && parseInt(minutesDigits) > 59) {
      minutesDigits = "59";
    }
    minutesDigits = minutesDigits.substring(0, 2);

    return `${validHours}:${minutesDigits}`;
  }
};

const currencyList = ["ETH", "USDC"];
const DEFAULT_LISTING_TIME = "15:00";

const getDefaultListingDate = (): Date => {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);

  return nextDay;
};

interface IProps {
  collections: Array<ICollection>;
  onClose: () => void;
  onSuccess?: () => void;
}

const ListForSale: FC<IProps> = ({ collections, onClose, onSuccess }) => {
  const { loadingStateHandler: setGlobalLoading } = useContext(LoadingContext);
  const [allNfts, setAllNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [selectedNft, setSelectedNft] = useState<any>(null);
  const [collectionSearchValue, setCollectionSearchValue] = useState("");
  const [nftSearchValue, setNftSearchValue] = useState("");

  const [date, setDate] = useState<Date>(() => getDefaultListingDate());
  const [time, setTime] = useState(DEFAULT_LISTING_TIME);
  const [currency, setCurrency] = useState("ETH");
  const [floorPrice, setFloorPrice] = useState(false);
  const [floorPriceValue, setFloorPriceValue] = useState<number | null>(null);
  const [price, setPrice] = useState<number>();

  const [isCurrencyList, setIsCurrencyList] = useState(false);
  const [isSuccessApprove, setIsSuccessApprove] = useState(false);
  const [isDurationList, setIsDurationList] = useState(false);
  const [isApproveCollection, setIsApproveCollection] = useState(false);

  const hasFloorPrice =
    floorPriceValue !== null &&
    Number.isFinite(floorPriceValue) &&
    floorPriceValue > 0;

  const handleReset = () => {
    setTime(DEFAULT_LISTING_TIME);
    setDate(getDefaultListingDate());
    setSelectedCollection(null);
    setSelectedNft(null);
    setFloorPrice(false);
    setFloorPriceValue(null);
    setPrice(0);
  };

  const validateData = () => {
    const isValidTime = !!time && time.length > 0;
    return !selectedNft || !price || !isValidTime;
  };

  const floorPriceHandler = () => {
    if (!hasFloorPrice) {
      return;
    }

    const nextFloorPrice = !floorPrice;

    if (nextFloorPrice) {
      setPrice(floorPriceValue || undefined);
    }

    setFloorPrice(nextFloorPrice);
  };

  const changeCurrency = (value: any) => {
    setCurrency(value);
    setFloorPriceValue(null);
    setIsCurrencyList(false);
  };

  const completeListing = () => {
    if (time && !time.includes(":") && time.length <= 2) {
      setTime(`${time.padStart(2, "0")}:00`);
    }
    setIsApproveCollection(true);
  };

  const approveCollectionHandler = async () => {
    setGlobalLoading(true);
    try {
      let timeString = time;
      if (time && !time.includes(":") && time.length <= 2) {
        timeString = `${time.padStart(2, "0")}:00`;
      } else if (time.includes(":")) {
        const [hours, minutes] = time.split(":");
        timeString = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
      }

      const timeEnd = addDateAndTime(new Date(date), timeString);
      const { nftId } = selectedNft;
      const tokenAddress = selectedCollection.smart;

      if (currency === "ETH") {
        const { currentNumber, currentDecimals } = getCurrentMarketDecimal(
          price || 0,
          ETH_DECIMALS
        );
        const priceBigNumber = numberToBigNumber(currentNumber, currentDecimals);

        const { currentOrder } = await getOrderByNftId(nftId, tokenAddress);
        if (currentOrder?.orderId && currentOrder?.available) {
          toast.error(
            <div>
              <h3>Error!</h3>
              <span>This NFT is already listed for ETH</span>
            </div>
          );
          return;
        }

        await approveNFT(tokenAddress, nftId);

        const { success, id } = await createOrder(
          timeEnd,
          nftId,
          tokenAddress,
          priceBigNumber
        );

        if (!success) return;

        let orderId = Number(id || 0);

        if (!orderId) {
          toast.error(
            <div>
              <h3>Error!</h3>
              <span>Failed to resolve ETH order id from blockchain</span>
            </div>
          );
          return;
        }

        const data: ICreateCollectionNft = {
          ...selectedNft,
          tokenAddress,
          price,
          nftId,
          collectionId: selectedCollection._id,
          orderId,
          endDate: timeEnd,
          isEth: true,
          isUsdc: false,
        };

        const { isSuccess } = await addListNft(data);
        if (!isSuccess) {
          toast.error(
            <div>
              <h3>Error!</h3>
              <span>Failed to save ETH listing in marketplace database</span>
            </div>
          );
          return;
        }
      }

      if (currency === "USDC") {
        const { currentNumber, currentDecimals } = getCurrentMarketDecimal(
          price || 0,
          USDC_DECIMALS
        );
        const priceBigNumber = numberToBigNumber(currentNumber, currentDecimals);

        const { currentOrder } = await getOrderUsdByNftId(nftId, tokenAddress);
        if (currentOrder?.orderId && currentOrder?.available) {
          toast.error(
            <div>
              <h3>Error!</h3>
              <span>This NFT is already listed for USDC</span>
            </div>
          );
          return;
        }

        await approveNFT(tokenAddress, nftId);

        const { success, id } = await createOrderUsd(
          timeEnd,
          nftId,
          tokenAddress,
          priceBigNumber
        );

        if (!success) return;
        let orderId = Number(id || 0);

        if (!orderId) {
          const { currentOrder: fallbackOrder } = await getOrderUsdByNftId(
            nftId,
            tokenAddress
          );
          orderId = Number(fallbackOrder?.orderId || 0);
        }

        if (!orderId) {
          toast.error(
            <div>
              <h3>Error!</h3>
              <span>Failed to resolve USDC order id from blockchain</span>
            </div>
          );
          return;
        }

        const data: ICreateCollectionNft = {
          ...selectedNft,
          tokenAddress,
          price,
          nftId,
          collectionId: selectedCollection._id,
          orderId,
          endDate: timeEnd,
          isEth: false,
          isUsdc: true,
        };

        const { isSuccess } = await addListNft(data);
        if (!isSuccess) {
          toast.error(
            <div>
              <h3>Error!</h3>
              <span>Failed to save USDC listing in marketplace database</span>
            </div>
          );
          return;
        }
      }

      setIsSuccessApprove(true);
      setTime(DEFAULT_LISTING_TIME);
      setDate(getDefaultListingDate());
      setAllNfts([]);
      setSelectedCollection(null);
      setFloorPrice(false);
      setFloorPriceValue(null);
      setPrice(0);

      setTimeout(() => {
        setSelectedNft(null);
        setIsApproveCollection(false);
        onClose();
        onSuccess?.();
        toast.success(
          <div>
            <h3>Success!</h3>
            <span>You have successfully added nft to the marketplace!</span>
          </div>
        );
      }, 500);
    } catch (err: any) {
      console.error("approveCollectionHandler error", err);
      toast.error(
        <div>
          <h3>Error!</h3>
          <span>{err?.message || "Something went wrong"}</span>
        </div>
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const selectCollection = (collection: any) => {
    setCollectionSearchValue("");
    setSelectedCollection(collection);
    setSelectedNft(null);
    setFloorPrice(false);
    setFloorPriceValue(null);
  };

  const removeCollection = () => {
    setSelectedCollection(null);
    setSelectedNft(null);
    setFloorPrice(false);
    setFloorPriceValue(null);
  };

  const selectNft = (nft: any) => {
    setNftSearchValue("");
    setSelectedNft(nft);
    setFloorPrice(false);
    setFloorPriceValue(null);
  };

  const filteredCollections = useMemo(() => {
    return collections.filter((collection: ICollection) => {
      return collection.name
        .toLowerCase()
        .includes(collectionSearchValue.toLowerCase());
    });
  }, [collectionSearchValue]);

  useEffect(() => {
    if (!selectedCollection || !window.ethereum.selectedAddress) return;

    getUserNfts(
      selectedCollection.smart,
      window.ethereum.selectedAddress,
      selectedCollection.metadataLink
    ).then(({ success, nftsData }: any) => {
      setAllNfts(nftsData);
    });
  }, [selectedCollection]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedCollection?.smart || selectedNft?.nftId === undefined) {
      setFloorPriceValue(null);
      return () => {
        isMounted = false;
      };
    }

    fetchNftFloorPrice(
      selectedCollection.smart,
      Number(selectedNft.nftId),
      currency === "USDC" ? "USDC" : "ETH"
    ).then(({ isSuccess, floorPrice: nextFloorPrice, hasFloorPrice }) => {
      if (!isMounted) return;

      if (!isSuccess || !hasFloorPrice || nextFloorPrice === null) {
        setFloorPriceValue(null);
        return;
      }

      setFloorPriceValue(Number(nextFloorPrice));
    });

    return () => {
      isMounted = false;
    };
  }, [currency, selectedCollection?.smart, selectedNft?.nftId]);

  useEffect(() => {
    if (!floorPrice) return;

    if (!hasFloorPrice) {
      setFloorPrice(false);
      return;
    }

    setPrice(floorPriceValue || undefined);
  }, [floorPrice, floorPriceValue, hasFloorPrice]);

  return (
    <S.Container>
      <Modal title="List for sale" onClose={onClose}>
        {isApproveCollection ? (
          <ApproveCollection nft={selectedNft} />
        ) : (
          <S.Body>
            <S.Inputs>
              <SearchList
                label="Collection:"
                inputLabel="Collection name"
                btnHandler={removeCollection}
                items={filteredCollections}
                selected={selectedCollection}
                selectHandler={selectCollection}
                searchValue={collectionSearchValue}
                inputHandler={(value: any) => setCollectionSearchValue(value)}
              />
              {selectedCollection ? (
                <SearchList
                  type="nfts"
                  loading={loading}
                  label="Nft:"
                  inputLabel="Nft name"
                  btnHandler={() => setSelectedNft("")}
                  items={allNfts}
                  selected={selectedNft}
                  selectHandler={selectNft}
                  searchValue={nftSearchValue}
                  inputHandler={(value: any) => setNftSearchValue(value)}
                />
              ) : null}
            </S.Inputs>
            <S.Price>
              <S.Key>Set a price</S.Key>
              {selectedNft ? (
                <S.FloorPrice>
                  <S.FloorPriceLabel>
                    {hasFloorPrice
                      ? `Set floor price to ${floorPriceValue} ${currency}`
                      : "Floor price is not available"}
                  </S.FloorPriceLabel>
                  <Checkbox
                    onChange={floorPriceHandler}
                    checked={floorPrice}
                    disabled={!hasFloorPrice}
                  />
                </S.FloorPrice>
              ) : null}
            </S.Price>
            <S.YourPrice>
              <S.Input
                value={price}
                type="number"
                onChange={(e: any) => {
                  setPrice(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  );
                  if (floorPrice) {
                    setFloorPrice(false);
                  }
                }}
                placeholder="0"
                id="collection-name"
                autoComplete="off"
              />
              <S.CurrencyWrapper>
                <S.SelectedCurrency
                  onClick={() => setIsCurrencyList((prev) => !prev)}
                >
                  {currency}
                  {isCurrencyList ? (
                    <Image
                      style={{ transform: "rotate(180deg)" }}
                      src={arrowIcon}
                      alt="arrow"
                    />
                  ) : (
                    <Image src={arrowIcon} alt="arrow" />
                  )}
                </S.SelectedCurrency>
                <S.CurrencyList className={isCurrencyList ? "visible" : ""}>
                  {currencyList.map((currency) => {
                    return (
                      <S.CurrencyBtn
                        onClick={() => changeCurrency(currency)}
                        key={currency}
                      >
                        {currency}
                      </S.CurrencyBtn>
                    );
                  })}
                </S.CurrencyList>
              </S.CurrencyWrapper>
            </S.YourPrice>
            <S.Duration>
              <S.Key>Duration</S.Key>
              <S.DurationInputs className={isDurationList ? "visible" : ""}>
                <S.DurationDateWrapper>
                  <ModalDatePicker
                    date={new Date(date)}
                    // @ts-ignore
                    onChange={(value) => setDate(new Date(value))}
                  />
                </S.DurationDateWrapper>
                <S.Input
                  value={time}
                  placeholder="hh:mm"
                  className="time-input"
                  onChange={(e: any) =>
                    setTime(formatTimeInput(e.target.value))
                  }
                />
              </S.DurationInputs>
            </S.Duration>
            <S.Results>
              <div>FOMO fee: {selectedCollection?.royalty || 0}%</div>
            </S.Results>
          </S.Body>
        )}
        <S.ConfirmWrapper>
          <S.Buttons>
            <Button onClick={onClose} className="red-btn">
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={validateData()}
              onClick={
                isApproveCollection ? approveCollectionHandler : completeListing
              }
            >
              Complete Listing
            </Button>
          </S.Buttons>
          <S.ResetWrapper>
            <Button onClick={handleReset} className="reset-btn">
              <RotateCcw size={16} />
              Reset
            </Button>
          </S.ResetWrapper>
        </S.ConfirmWrapper>
      </Modal>
    </S.Container>
  );
};

export default ListForSale;
