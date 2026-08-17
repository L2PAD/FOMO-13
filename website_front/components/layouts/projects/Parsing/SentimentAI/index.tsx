import React, { FC, useContext, useMemo, useState } from "react";
import {
  AccountInfoWrapper,
  AddBtnWrapper,
  Header,
  ItemImagesWrapper,
  List,
  ListItem,
  ListItemHeader,
  ListItemTweets,
  SelectedItems,
  TweetItem,
  Wrapper,
} from "./styles";
import EntityInfo from "../../../../global/common/EntityInfo";
import RefreshIcon from "../../../../global/Icons/RefreshIcon";
import HorizontalDotsIcon from "../../../../global/Icons/HorizontalDots";
import ArrowSelectIcon from "../../../../global/Icons/ArrowSelectIcon";
import { TableHeaderRightWrapper } from "../../CryptoMarket/styles";
import AllIcon from "../../../../../assets/icons/all-sort.svg";
import Image from "next/image";
import ArrowBackIcon from "../../../../global/Icons/ArrowBackIcon";
import { ArrowRightIcon, CloseIcon, EditIcon } from "../../../../global/Icons";
import EmptyList from "../../../../global/EmptyList";
import { Button } from "../../../../global/common/Button";
import CreateParsingModal from "../../modals/CreateParsingModal";
import { useQuery } from "react-query";
import fetchTwitterAccs from "../../../../../http/parcing/fetchTwitterAccs";
import moment from "moment";
import Placeholder from "../../../../global/common/Placeholder";
import ImageModal from "../../../../global/ImageModal";
import ActionsModal from "../../../../global/ActionsModal";
import SearchParsingAccounts from "../../../../global/SearchParsingAccounts";
import { IKeywordTweet, IParcingTwitterAcc } from "../../../../../types/global_types";
import DeleteModal from "../../../../global/modals/DeleteModal";
import { LoadingContext } from "../../../../global/Layout";
import deleteTwitterPerson from "../../../../../http/parcing/deleteTwitterParsing";
import { Item } from "../../FomoChat/Clink/styles";
import updateTwitterKeywords from "../../../../../http/parcing/updateTwitterKeywords";
import UpdateParsingModal from "../../modals/UpdateParsingModal";
import EmptySection from "../../../../global/EmptySection";
import LiveParsing from "../LiveParsing";
import updateParsing from "../../../../../http/parcing/updateParsing";
import { toast } from "react-toastify";
import { formatKeywordsToTags, linkify } from "../CustomTwitterAccs";
import MoodBar from "../../../../global/MoodBar";
import { ActionsWrapper } from "../styles";
import PlaceholderTable from "../../../../global/common/PlaceholderTable";
import CreateTradingModal from "../../modals/CreateTradingModal";
import SentimentPostModal from "./PostModal";
import { useTranslation } from "i18n";

const SentimentAI = () => {
  const { translateText } = useTranslation();
  const [filterValue, setFilterValue] = useState("all");
  const { data, refetch, isLoading } = useQuery(
    ["sentiment-twitter-accs", filterValue],
    () => fetchTwitterAccs(`/user?type=sentiment&filter=${filterValue}`),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      refetchInterval: 60 * 60 * 1000,
    }
  );
  const { loadingStateHandler } = useContext(LoadingContext);
  const [isCreateParsing, setIsCreateParsing] = useState<boolean>(false);
  const [isCreatingParsing, setIsCreatingParsing] = useState<boolean>(false);
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [hiddenAccs, setHiddenAccs] = useState<Array<any>>([]);
  const [actionModalId, setActionModalId] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<IParcingTwitterAcc | null>(null);
  const [itemToDelete, setItemToDelete] = useState<IParcingTwitterAcc | null>(
    null
  );
  const [postDetails, setPostDetails] = useState<IKeywordTweet | null>(null)

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

  const confirmDeleteParsing = async (): Promise<void> => {
    if (!itemToDelete?._id) return;

    loadingStateHandler(true);

    const { success } = await deleteTwitterPerson(itemToDelete._id);

    if (success) {
      await refetch();
    }
    setItemToDelete(null);
    loadingStateHandler(false);
  };

  const confirmUpdateParsingAccount = async (
    id: string,
    username: string
  ): Promise<void> => {
    setIsCreateParsing(true);

    const { success } = await updateParsing({
      id,
      username,
      isPrivate: true,
    });

    setIsCreateParsing(false);

    if (success) {
      await refetch();
      toast.success(
        <div>
          <h3>{translateText("Twitter account successfully parsed")}</h3>
        </div>
      );
    }
  };

  const mockAcc: IParcingTwitterAcc = {
    _id: "1",
    name: "Twitter",
    username: "twitter",
    avatar: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
    followersCount: 100,
    followingCount: 100,
    description: "This is Twitter official account",
    mood: { score: 0.5, label: "Neutral" },
    tweets: [],
    last100Tweets: [],
    tweetCount: 0,
    type: "account",
  };

  const filteredAccounts: Array<IParcingTwitterAcc> = useMemo(() => {
    if (!data?.accs?.length) return [mockAcc];

    return data.accs.filter((acc: IParcingTwitterAcc) => {
      return !hiddenAccs.find(
        (hiddenAcc: IParcingTwitterAcc) => hiddenAcc._id === acc._id
      );
    });
  }, [data, hiddenAccs]);

  return (
    <Wrapper>
      <div
        style={{
          position: "relative",
        }}
      >
        <ActionsWrapper id="scroll-header" className="sentiment-actions">
          <SearchParsingAccounts
            subtype="sentiment"
            selectedItems={filteredAccounts}
            onChange={toggleAccount}
            type="/user"
            className="search-acc-input"
          />

          {!isCreatingParsing && filteredAccounts?.length ? (
            <AddBtnWrapper>
              <Button
                variant={"primary"}
                onClick={() => setIsCreateParsing(true)}
              >
                {translateText("Add Parsing")}
              </Button>
            </AddBtnWrapper>
          ) : (
            <></>
          )}
        </ActionsWrapper>
        {isLoading ? (
          <>
            <br />
            <PlaceholderTable />
            <br />
          </>
        ) : (
          <></>
        )}
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
        <TableHeaderRightWrapper>
          <button
            className={filterValue === "all" ? "selectedSort" : ""}
            onClick={() => setFilterValue("all")}
          >
            <Image src={AllIcon} alt="all" />
            {translateText("All Accounts")}
          </button>
          <button
            className={filterValue === "Positive" ? "selectedSort" : ""}
            onClick={() => setFilterValue("Positive")}
          >
            {translateText("Positive")}
          </button>
          <button
            className={filterValue === "Neutral" ? "selectedSort" : ""}
            onClick={() => setFilterValue("Neutral")}
          >
            {translateText("Neutral")}
          </button>
          <button
            className={filterValue === "Negative" ? "selectedSort" : ""}
            onClick={() => setFilterValue("Negative")}
          >
            {translateText("Negative")}
          </button>
        </TableHeaderRightWrapper>
      </div>
      <List>
        {isCreatingParsing ? (
          <Placeholder
            description={translateText(
              "Parsing in progress. This may take up to a minute. Please wait..."
            )}
            height="200px"
          />
        ) : filteredAccounts?.length ? (
          filteredAccounts.map((item, i: number) => {
            return (
              <ListItem key={i} variant="main">
                <ListItemHeader>
                  <AccountInfoWrapper>
                    <EntityInfo
                      variant="default"
                      rating={0}
                      size="medium"
                      name={item.name}
                      username={item.name}
                      niche={`@${item.username}`}
                      img={item.avatar}
                      isFollowersInfo
                      followers={item.followersCount}
                      following={item.followingCount}
                    />
                  </AccountInfoWrapper>
                  <div className="acc-item-left-wrapper">
                    <div className="mood-bar-wrapper">
                      <MoodBar
                        isMain={true}
                        score={item?.mood?.score || 0}
                        accuracy={item?.mood?.score || 0}
                        label={item?.mood?.label || "Negative"}
                      />
                    </div>
                    <div className="actions">
                      <button
                        onClick={() =>
                          confirmUpdateParsingAccount(item._id, item.username)
                        }
                      >
                        <RefreshIcon variant="big" />
                      </button>
                      <button
                        onClick={() => toggleItem(i)}
                        className="arrow-toggle"
                      >
                        <div
                          className={
                            openItems.includes(i) ? "arrow rotated" : "arrow"
                          }
                        >
                          <ArrowSelectIcon variant="small" />
                        </div>
                      </button>
                      <div className="actions-wrapper">
                        <ActionsModal
                          isVisible={item._id === actionModalId}
                          onClose={() => setActionModalId(null)}
                          actions={[
                            {
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                >
                                  <path
                                    d="M8.96578 4.63364L11.3658 7.03364M2.96582 13.0336L5.87648 12.4472C6.03099 12.416 6.17287 12.3399 6.2843 12.2284L12.8001 5.70909C13.1125 5.39652 13.1123 4.88986 12.7996 4.57756L11.4193 3.19884C11.1068 2.88666 10.6004 2.88687 10.2881 3.19931L3.77166 9.71935C3.66045 9.83062 3.58452 9.97221 3.55336 10.1264L2.96582 13.0336Z"
                                    stroke="#738094"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ),
                              label: translateText("Edit Parsing"),
                              onClick: () => {
                                setItemToEdit(item);
                                setActionModalId(null);
                              },
                            },
                            {
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="14"
                                  viewBox="0 0 12 14"
                                  fill="none"
                                >
                                  <path
                                    d="M0.666992 3.11765H11.3337M4.00033 1H8.00033M8.33366 13H3.66699C2.93061 13 2.33366 12.3679 2.33366 11.5882L2.02926 3.85292C2.01348 3.45189 2.31627 3.11765 2.69535 3.11765H9.3053C9.68438 3.11765 9.98717 3.45189 9.97139 3.85292L9.66699 11.5882C9.66699 12.3679 9.07004 13 8.33366 13Z"
                                    stroke="#738094"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              ),
                              label: translateText("Delete Parsing"),
                              onClick: () => {
                                setItemToDelete(item);
                                setActionModalId(null);
                              },
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </ListItemHeader>
                <ListItemTweets isOpen={openItems.includes(i)}>
                  {item?.tweets?.length ? (
                    item.tweets.map((tweet, j: number) => (
                      <TweetItem key={j}>
                        <div className="tweet-body">
                          <div className="tweet-text">
                            {linkify(tweet.text)}
                          </div>
                          <div className="tweet-right">
                            <MoodBar
                              isMain={false}
                              score={tweet?.mood?.score || 0}
                              accuracy={tweet?.mood?.score || 0}
                              label={tweet?.mood?.label || "Negative"}
                            />
                            <div className="tweet-date">
                              {moment(tweet.createdAt).fromNow()}
                            </div>
                            <button
                              onClick={() => setPostDetails(tweet)}
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
                        </div>
                        {tweet?.photos?.length ? (
                          <ItemImagesWrapper>
                            {tweet.photos.map((photo: string, i: number) => {
                              return (
                                <img
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
                  ) : (
                    <></>
                  )}
                </ListItemTweets>
              </ListItem>
            );
          })
        ) : (
          <>
            <br />
            <EmptySection
              isFullAuth
              className="small-empty-section"
              title={translateText("No Parsings Yet")}
              description={translateText(
                "Start tracking Twitter accounts or keywords in real-time. Click to create your first stream."
              )}
              onClick={() => setIsCreateParsing(true)}
              btnText={translateText("Add Parsing")}
            />
            <br />
          </>
        )}
      </List>
      <CreateParsingModal
        isSentiment={true}
        isVisible={isCreateParsing}
        onClose={() => setIsCreateParsing(false)}
        refetch={refetch}
        setIsCreatingParsing={(value: boolean) => setIsCreatingParsing(value)}
      />
      {modalImage ? (
        <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
      ) : (
        <></>
      )}
      <DeleteModal
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteParsing}
        variant="small"
        isVisible={!!itemToDelete}
        text={`
                <h3>${translateText("Delete Parsing?")}</h3>
                <p>${translateText(
                  "You're about to delete this parsing from your list - proceed?"
                )}</p>                
                `}
      />
      <UpdateParsingModal
        id={itemToEdit?._id || ""}
        isVisible={!!itemToEdit?._id}
        onClose={() => {
          setItemToEdit(null);
        }}
        onConfirm={async () => {
          setItemToEdit(null);
          await refetch();
        }}
      />
      <SentimentPostModal
      isVisible={!!postDetails}
      onClose={() => setPostDetails(null)}
      postData={postDetails}
      />
    </Wrapper>
  );
};

export default SentimentAI;
