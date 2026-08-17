import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  ICollectionNft,
  ICreateOrder,
  IOrder,
} from "../../../../../types/global_types";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import MyCartModal from "../../../nfts/modals/MyCartModal";
import TabsInfo from "./TabsInfo";
import imageLoader from "../../../../../helpers/imageLoader";
import createOrder from "../../../../../http/order/createOrder";
import {
  approveUsd,
  checkNftOwner,
  createItemForSm,
  createItemForSmUsd,
} from "../../../../../smart/initialSmartMarketplace";
import {
  ActionsUser,
  ActionsUserTitle,
  ActionsUserWrapper,
  ActionsWrapper,
  AuthorWrapper,
  ButtonsWrapper,
  BuyButton,
  ConfirmOrderWrapper,
  ContentWrapper,
  DataDescription,
  ImageWrapper,
  NFTDataWrapper,
  NFTName,
  NFTNameWrapper,
  NFTTag,
  OrderButton,
  OrderDate,
  OrderDateLabel,
  OrderDateWrapper,
  PageWrapper,
  TimeWrapper,
} from "./styles";
import { CartContext, LoadingContext } from "../../../../global/Layout";
import { DateInput } from "../../modals/CustomAssetModal/styles";
import ModalDatePicker from "../../../../global/common/components_for_modals/modal_date_picker";
import { useQuery } from "react-query";
import fetchOrders from "../../../../../http/order/fetchOrders";
import confirmOrder from "../../../../../http/order/confirmOrder";
import toggleNft from "../../../../../http/cart/toggleNft";
import { useRouter } from "next/router";
import TimeInput from "../../../../global/timeInput/TimeInput";
import addDateAndTime from "../../../../../helpers/addDateAndTime";

interface INftContext {
  isOwner: boolean;
  orders: Array<IOrder>;
  nftData: ICollectionNft | object;
  confirmOrderByOwner: (order: IOrder) => Promise<void>;
}

export const NftContext = createContext<INftContext>({
  isOwner: false,
  orders: [],
  nftData: {},
  confirmOrderByOwner: async (order: IOrder) => {},
});

const Project: FC<{ nftData: ICollectionNft }> = ({ nftData }) => {
  const { query } = useRouter();
  const currency: "USDC" | "ETH" = query?.currency === "USDC" ? "USDC" : "ETH";
  const [isApprove, setIsApprove] = useState<boolean>(false);
  const { data, refetch } = useQuery("orders", () =>
    fetchOrders("active", nftData._id)
  );
  const { loadingStateHandler } = useContext(LoadingContext);
  const cartData = useContext(CartContext);
  const [isOwner, setIsOwner] = useState(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [cartModal, setCartModal] = useState<boolean>(false);
  const [isOrder, setIsOrder] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(0);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [name, number] = nftData?.name?.split("#");
  const isCart: boolean = !!cartData.cart?.find(
    (item: any) => item?.nftId._id === nftData._id
  );
  const [time, setTime] = useState({ hours: "", minutes: "" });

  const confirmApprove = async () => {
    loadingStateHandler(true);
    const approveValue = 0;

    await approveUsd(approveValue);

    setIsApprove(true);
    loadingStateHandler(false);
  };

  const confirmCreateOrder = async (): Promise<void> => {
    loadingStateHandler(true);
    const isEthOrder = currency === "ETH";

    const orderData: ICreateOrder = {
      collectionId: nftData.collection?._id || "",
      collectionNftId: nftData._id || "",
      projectId: nftData.project?._id || "",
      endDate: new Date(
        addDateAndTime(endDate, `${time.hours || "24"}:${time.minutes || "00"}`)
      ),
      isEth: isEthOrder,
      isUsdc: !isEthOrder,
      price,
      belowFloor: ((nftData.price - price) / nftData.price) * 100,
    };

    const { isSuccess } = await createOrder("orders", orderData);

    if (isSuccess) {
      refetch();
      setIsOrder(false);
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Order created!</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const confirmOrderByOwner = async (order: IOrder): Promise<void> => {
    const createFn = order?.isUsdc ? createItemForSmUsd : createItemForSm;

    const { success, id } = await createFn(
      new Date(order.endDate).getTime() / 1000,
      nftData.nftId,
      String(nftData.collection?.smart),
      order.price,
      order.user.wallet
    );

    if (!success) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Failed to create order for this NFT!</p>
        </div>
      );
      return;
    }

    const { isSuccess } = await confirmOrder(order._id, Number(id || 0));

    if (isSuccess) {
      refetch();
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Order confirmed!</p>
        </div>
      );
    }
  };

  const toggleNftInCart = async (): Promise<void> => {
    const { isSuccess } = await toggleNft(nftData._id, "POST");

    if (isSuccess) {
      cartData.refetch();
    }
  };

  useEffect(() => {
    checkNftOwner(nftData?.collection?.smart, nftData?.nftId).then(
      ({ isOwner }) => {
        setIsOwner(isOwner);
      }
    );
  }, [nftData]);

  return (
    <NftContext.Provider
      value={{
        isOwner: !!isOwner,
        orders: data?.orders || [],
        nftData,
        confirmOrderByOwner,
      }}
    >
      <PageWrapper>
        <BreadCrumbs
          items={[
            { title: "Projects", link: "/gemslab/projects" },
            { title: nftData.name, link: `/utility/market/${nftData._id}` },
          ]}
        />
        <ContentWrapper>
          <ImageWrapper>
            <img
              width={100}
              height={100}
              src={nftData.external_url}
              alt="SharkRace Club"
            />
          </ImageWrapper>
          <NFTDataWrapper>
            <div>
              <AuthorWrapper>
                <UserAvatar
                  avatar={
                    nftData?.owner?.avatar
                      ? imageLoader(nftData?.owner?.avatar)
                      : nftData?.owner?.twitterData?.photo
                  }
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <Typography variant="p">
                  {nftData?.owner?.username ||
                    nftData?.owner?.twitterData?.name}
                </Typography>
              </AuthorWrapper>
              <NFTNameWrapper>
                <NFTName variant="h1">{name}</NFTName>
                <NFTTag>#{number}</NFTTag>
              </NFTNameWrapper>
              <div>
                <DataDescription>
                  {nftData?.project?.bio}
                  {/* <span onClick={() => setShowAll((state) => !state)}>
                  {showAll ? "Hide all" : "Show more"}
                </span> */}
                </DataDescription>
              </div>
              <ActionsWrapper>
                <ActionsUserWrapper>
                  <ActionsUser
                    avatar={nftData.external_url}
                    name="name"
                    size="small"
                    variant="default"
                  />
                  <ActionsUserTitle variant="p">
                    Listed on <i>FOMO</i> for
                    <br />
                    <span>
                      {nftData.price} {currency}
                    </span>
                  </ActionsUserTitle>
                </ActionsUserWrapper>
                <ButtonsWrapper>
                  {!isOrder ? (
                    <BuyButton
                      disabled={isOwner}
                      variant="primary"
                      onClick={toggleNftInCart}
                    >
                      {isCart ? "Cancel purchase" : "Buy"}
                    </BuyButton>
                  ) : (
                    <></>
                  )}
                  {isOrder ? (
                    <OrderDate>
                      <OrderDateWrapper>
                        <ModalDatePicker
                          date={endDate}
                          onChange={(value: any) => setEndDate(value)}
                        />
                      </OrderDateWrapper>
                      <TimeWrapper>
                        <TimeInput handler={(value: any) => setTime(value)} />
                      </TimeWrapper>
                    </OrderDate>
                  ) : (
                    <></>
                  )}
                  {!isOrder ? (
                    <OrderButton
                      disabled={isOwner}
                      onClick={() => setIsOrder(true)}
                    >
                      + Make order
                    </OrderButton>
                  ) : (
                    <ConfirmOrderWrapper>
                      <input
                        value={price}
                        onChange={(e: any) => setPrice(e.target.value)}
                        type="number"
                        placeholder="0"
                      />
                      <button onClick={confirmCreateOrder}>Confirm</button>
                    </ConfirmOrderWrapper>
                  )}
                </ButtonsWrapper>
              </ActionsWrapper>
            </div>
            <TabsInfo />
          </NFTDataWrapper>
        </ContentWrapper>
        {cartModal && <MyCartModal onClose={() => setCartModal(false)} />}
      </PageWrapper>
    </NftContext.Provider>
  );
};

export default Project;
