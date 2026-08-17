import React, { useMemo, useState, useEffect } from "react";
import {
  AccountInfoWrapper,
  ItemImagesWrapper,
  List,
  ListItem,
  ListItemHeader,
  ListItemTweets,
  ListWrapper,
  SelectedItems,
  TweetItem,
  MobileAccountsSlider,
} from "../styles";
import EntityInfo from "../../../../../global/common/EntityInfo";
import RefreshIcon from "../../../../../global/Icons/RefreshIcon";
import HorizontalDotsIcon from "../../../../../global/Icons/HorizontalDots";
import ArrowSelectIcon from "../../../../../global/Icons/ArrowSelectIcon";
import EmptyList from "../../../../../global/EmptyList";
import Placeholder from "../../../../../global/common/Placeholder";
import moment from "moment";
import ImageModal from "../../../../../global/ImageModal";
import { CloseIcon } from "../../../../../global/Icons";
import { IParcingTwitterAcc } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { ActionsWrapper } from "../../styles";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../../P2PExchange/styles";
import CustomSelect from "../../../../../global/common/CustomSelect";
import SearchParsingAccounts from "../../../../../global/SearchParsingAccounts";
import updateParsing from "../../../../../../http/parcing/updateParsing";
import { toast } from "react-toastify";
import { linkify } from "..";
// Import Swiper components
import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import { useTranslation } from "i18n";

export function formatKeywordsToTags(input?: string): string {
  if (!input) return "";
  return input
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word.length > 0)
    .map((word) => `#${word}`)
    .reverse()
    .join(" ");
}

interface TwitterAccountsListProps {
  data: any;
  refetch: any;
  isCreatingParsing: boolean;
}

const TwitterAccountsList: React.FC<TwitterAccountsListProps> = ({
  data,
  refetch,
  isCreatingParsing,
}) => {
  const { translateText } = useTranslation();
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [hiddenAccs, setHiddenAccs] = useState<Array<IParcingTwitterAcc>>([]);
  const [actionModalId, setActionModalId] = useState<number | null>();
  const [blockedAccs, setBlockedAccs] = useState<Array<string>>([]);
  const [category, setCategory] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const openImageModal = (src: string) => {
    setModalImage(src);
  };

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAccount = (item: IParcingTwitterAcc): void => {
    if (hiddenAccs.find((acc: IParcingTwitterAcc) => acc._id === item._id)) {
      setHiddenAccs((accounts: Array<IParcingTwitterAcc>) => {
        return accounts.filter((selectedAcc: IParcingTwitterAcc) => {
          return selectedAcc._id !== item._id;
        });
      });
      return;
    }

    const updatedAccs: Array<any> = [item, ...hiddenAccs];

    setHiddenAccs(updatedAccs);
  };

  const confirmUpdateParsingAccount = async (
    id: string,
    username: string
  ): Promise<void> => {
    setBlockedAccs((prev: Array<string>) => [...prev, id]);

    const { success } = await updateParsing({
      id,
      username,
      isPrivate: false,
    });

    if (success) {
      await refetch();
      toast.success(
        <div>
          <h3>{translateText("Twitter account successfully parsed")}</h3>
        </div>
      );
    }

    setBlockedAccs((prev: Array<string>) => {
      return prev.filter((item: string) => item !== id);
    });
  };

  if (isCreatingParsing) {
    return (
      <Placeholder
        description="Parsing in progress. This may take up to a minute. Please wait..."
        height="200px"
      />
    );
  }

  const filteredAccounts: Array<IParcingTwitterAcc> = useMemo(() => {
    if (!data?.accs?.length) return [];

    return data.accs.filter((acc: IParcingTwitterAcc) => {
      return !hiddenAccs.find(
        (hiddenAcc: IParcingTwitterAcc) => hiddenAcc._id === acc._id
      );
    });
  }, [data, hiddenAccs]);

  const renderAccountItem = (item: any, i: number) => {
    const isOpen = openItems.includes(i);
    const isParsing = blockedAccs.includes(item._id);

    if (isParsing) {
      return (
        <Placeholder
          key={item._id}
          description="Parsing in progress. This may take up to a minute. Please wait..."
          height="200px"
        />
      );
    }

    return (
      <ListItem key={item._id} variant="main">
        <ListItemHeader>
          <AccountInfoWrapper>
            <EntityInfo
              variant="default"
              rating={0}
              size="medium"
              name={item.name}
              username={item.name}
              niche={`${item.description}`}
              img={item.avatar}
              isFollowersInfo
              followers={item.followersCount}
              following={item.followingCount}
            />
          </AccountInfoWrapper>
          <div className="keywords" />
          <div className="actions">
            <button
              onClick={() =>
                confirmUpdateParsingAccount(item._id, item.username)
              }
            >
              <RefreshIcon variant="big" />
            </button>
            <button onClick={() => toggleItem(i)} className="arrow-toggle">
              <div className={isOpen ? "arrow rotated" : "arrow"}>
                <ArrowSelectIcon variant="small" />
              </div>
            </button>
          </div>
        </ListItemHeader>
        <ListItemTweets isOpen={isOpen}>
          {item?.tweets?.length
            ? item.tweets.map((tweet: any, j: number) => (
                <TweetItem key={`${tweet.id}${j}`}>
                  <div className="tweet-body">
                    <div className="tweet-text">{linkify(tweet.text)}</div>
                    <div className="tweet-date">
                      {moment(tweet.createdAt).fromNow()}
                    </div>
                    <button
                      onClick={() => {
                        window.open(
                          `https://x.com/${item.username}/status/${tweet.id}`
                        );
                      }}
                      className="tweet-btn"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="16"
                        viewBox="0 0 18 16"
                        fill="none"
                      >
                        <path
                          d="M10.3333 1L17 8M17 8L10.3333 15M17 8L1 8"
                          stroke="#738094"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  {tweet?.photos?.length ? (
                    <ItemImagesWrapper>
                      {tweet.photos.map((photo: string, i: number) => {
                        return (
                          <img
                            key={i}
                            src={photo}
                            alt={item.name}
                            onClick={() => openImageModal(photo)}
                            style={{ cursor: "pointer" }}
                          />
                        );
                      })}
                    </ItemImagesWrapper>
                  ) : (
                    <></>
                  )}
                </TweetItem>
              ))
            : null}
        </ListItemTweets>
      </ListItem>
    );
  };

  return (
    <>
      <ActionsWrapper id="scroll-header">
        <SearchParsingAccounts
          selectedItems={filteredAccounts}
          onChange={toggleAccount}
        />
        <CustomSelect
          placeholder={translateText("All Categories")}
          options={[
            {
              value: "ALL",
              label: translateText("All Categories"),
            },
            {
              value: "1",
              label: "Category 1",
            },
            {
              value: "2",
              label: "Category 2",
            },
          ]}
          onChange={(value: string) => setCategory(value)}
        />
      </ActionsWrapper>
      <ListWrapper>
        {filteredAccounts?.length ? (
          <SelectedItems>
            {filteredAccounts.map((item: any) => {
              return (
                <div key={item._id}>
                  <img src={item.avatar} alt={item.name} />
                  <span>{item.name}</span>
                  <button onClick={() => toggleAccount(item)}>
                    <CloseIcon fill="#738094" />
                  </button>
                </div>
              );
            })}
          </SelectedItems>
        ) : (
          <></>
        )}
        {filteredAccounts.length ? (
          isMobile ? (
            <MobileAccountsSlider>
              <Swiper
                spaceBetween={15}
                slidesPerView={"auto"}
                centeredSlides={false}
                className="accounts-swiper"
              >
                {filteredAccounts.map((item: any, i: number) => (
                  <SwiperSlide key={item._id}>
                    {renderAccountItem(item, i)}
                  </SwiperSlide>
                ))}
              </Swiper>
            </MobileAccountsSlider>
          ) : (
            <List>
              {filteredAccounts.map((item: any, i: number) =>
                renderAccountItem(item, i)
              )}
            </List>
          )
        ) : (
          <List>
            <br />
            <br />
            <EmptyList />
            <br />
          </List>
        )}
        {modalImage ? (
          <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
        ) : (
          <></>
        )}
      </ListWrapper>
    </>
  );
};

export default TwitterAccountsList;
