import React, { FC, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../../../../common/modal";
import Button from "../../../../common/button";
import Loader from "../../../../common/loader";
import ChatModal from "../../../FomoChat/ChatModal";
import getAccessToken from "../../../../utils/getAccessToken";
import startAppealProcess from "../../../../services/deals/startAppealProcess";
import resolveAppeal from "../../../../services/deals/resolveAppeal";
import fetchDealByIdForStaff from "../../../../services/deals/fetchDealByIdForStaff";
import { adminCompleteDealETH, adminCompleteDealUSDC } from "../../../../smart/smartOtc";
import { IAppeal, IDeal } from "../../../../types/global_types";
import { useStyles } from "./styles";
import loader from "../../../../services/loader";
import sliceAddress from "../../../../utils/sliceAddress";
import avatarImage from "../../../../../assets/img/avatar.png";

interface IProps {
  appeals: IAppeal[];
  isFetching: boolean;
  searchValue: string;
  sortValue: string;
  onRefetch: () => void;
}

const AppealsTable: FC<IProps> = ({
  appeals,
  isFetching,
  searchValue,
  sortValue,
  onRefetch,
}) => {
  const styles = useStyles();
  const token = getAccessToken() || "";
  const [activeAppeal, setActiveAppeal] = useState<IAppeal | null>(null);
  const [resolveText, setResolveText] = useState("");
  const [forceCloseDeal, setForceCloseDeal] = useState(true);
  const [recipient, setRecipient] = useState<"escrow_funder" | "buyer">("escrow_funder");
  const [feeMode, setFeeMode] = useState<"with_fee" | "without_fee">("with_fee");
  const [isResolving, setIsResolving] = useState(false);
  const [chatId, setChatId] = useState<string>("");
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [dealDetails, setDealDetails] = useState<IDeal | null>(null);
  const [isDealModalVisible, setIsDealModalVisible] = useState(false);
  const [isDealLoading, setIsDealLoading] = useState(false);
  const [resolveDeal, setResolveDeal] = useState<IDeal | null>(null);
  const [isResolveDealLoading, setIsResolveDealLoading] = useState(false);

  const userData = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("fomoUser");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }, []);

  const filteredAppeals = useMemo(() => {
    const query = searchValue?.trim()?.toLowerCase();
    let list = [...appeals];

    if (query) {
      list = list.filter((item) => {
        const searchFields = [
          item.appealId,
          item.reason,
          item.description,
          item.creator?.username,
          item.creator?.wallet,
          item.deal?._id,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());

        return searchFields.some((field) => field.includes(query));
      });
    }

    if (sortValue === "Old") {
      list.sort(
        (a, b) =>
          new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
      );
    } else if (sortValue === "status-asc") {
      list.sort((a, b) => String(a.status || "").localeCompare(String(b.status || "")));
    } else if (sortValue === "status-desc") {
      list.sort((a, b) => String(b.status || "").localeCompare(String(a.status || "")));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
      );
    }

    return list;
  }, [appeals, searchValue, sortValue]);

  const getStatusClass = (status: string) => {
    if (status === "resolved") return `${styles.status} ${styles.statusResolved}`;
    if (status === "in_review") return `${styles.status} ${styles.statusReview}`;
    return `${styles.status} ${styles.statusOpen}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleString();
  };

  const yesNo = (value: unknown): string => (value ? "YES" : "NO");
  const getDealTypeClass = (type?: string): string =>
    type === "sell"
      ? `${styles.dealType} ${styles.dealTypeSell}`
      : `${styles.dealType} ${styles.dealTypeBuy}`;
  const getUserAvatar = (user?: any): string =>
    user?.photo ? loader(user.photo) : user?.twitterData?.photo || avatarImage;
  const getUserName = (user?: any): string =>
    user?.username || user?.twitterData?.username || "Unknown";
  const getUserWallet = (user?: any): string =>
    user?.wallet ? sliceAddress(user.wallet, "2x4") : "N/A";
  const currentResolveDeal = (activeAppeal?.deal as IDeal | undefined) || resolveDeal;
  const escrowFunderUser =
    currentResolveDeal?.type === "sell" ? currentResolveDeal?.creator : currentResolveDeal?.buyer;
  const nonFunderUser =
    currentResolveDeal?.type === "sell" ? currentResolveDeal?.buyer : currentResolveDeal?.creator;

  useEffect(() => {
    const loadResolveDeal = async () => {
      if (!activeAppeal) {
        setResolveDeal(null);
        setIsResolveDealLoading(false);
        return;
      }

      if (activeAppeal.deal?._id) {
        setResolveDeal(activeAppeal.deal as IDeal);
        setIsResolveDealLoading(false);
        return;
      }

      if (!activeAppeal.dealId) {
        setResolveDeal(null);
        setIsResolveDealLoading(false);
        return;
      }

      setIsResolveDealLoading(true);
      const detailsResponse = await fetchDealByIdForStaff(activeAppeal.dealId);

      if (detailsResponse?.success && detailsResponse?.data) {
        setResolveDeal(detailsResponse.data as IDeal);
      } else {
        setResolveDeal(null);
      }

      setIsResolveDealLoading(false);
    };

    loadResolveDeal();
  }, [activeAppeal]);

  const openChat = (id?: string) => {
    if (!id) return;
    setChatId(id);
    setIsChatVisible(true);
  };

  const openDealDetails = async (dealId?: string) => {
    if (!dealId) return;

    setIsDealLoading(true);
    setIsDealModalVisible(true);

    const response = await fetchDealByIdForStaff(dealId);
    if (!response?.success) {
      toast.error("Failed to fetch deal details");
      setIsDealLoading(false);
      return;
    }

    setDealDetails(response?.data || null);
    setIsDealLoading(false);
  };

  const handleStartProcess = async (appeal: IAppeal) => {
    const response = await startAppealProcess(appeal._id);

    if (!response?.success) {
      toast.error("Failed to start appeal process");
      return;
    }

    const responseChatId = response?.data?.chat?._id || response?.data?.appeal?.supportChatId;
    if (responseChatId) {
      setChatId(responseChatId);
      setIsChatVisible(true);
    }

    toast.success("Appeal process started");
    onRefetch();
  };

  const handleResolve = async () => {
    if (!activeAppeal?._id) return;

    setIsResolving(true);
    let txHash: string | undefined;

    if (forceCloseDeal) {
      let deal = currentResolveDeal;
      let smartDealId = deal?.dealId ? Number(deal.dealId) : undefined;

      if ((!smartDealId || Number.isNaN(smartDealId)) && (deal?._id || activeAppeal.dealId)) {
        const detailsResponse = await fetchDealByIdForStaff(deal?._id || activeAppeal.dealId);
        if (detailsResponse?.success && detailsResponse?.data) {
          deal = detailsResponse.data as IDeal;
          smartDealId = deal?.dealId ? Number(deal.dealId) : undefined;
        }
      }

      if (!deal || typeof smartDealId !== "number") {
        toast.error("Deal smart ID is missing");
        setIsResolving(false);
        return;
      }

      const isReturn = recipient === "escrow_funder";
      const takeFee = feeMode === "with_fee";

      const smartResult =
        String(deal.ticker || "").toLowerCase() === "eth"
          ? await adminCompleteDealETH(smartDealId, isReturn, takeFee)
          : await adminCompleteDealUSDC(smartDealId, isReturn, takeFee);

      if (!smartResult?.isSuccess) {
        toast.error("Smart contract error. Admin wallet required");
        setIsResolving(false);
        return;
      }

      txHash = smartResult.txHash;
    }

    const response = await resolveAppeal(activeAppeal._id, {
      resolution: resolveText || "Resolved by staff",
      forceCloseDeal,
      recipient,
      feeMode,
      txHash,
    });

    if (!response?.success) {
      toast.error("Failed to resolve appeal");
      setIsResolving(false);
      return;
    }

    toast.success("Appeal resolved");
    setActiveAppeal(null);
    setResolveText("");
    setForceCloseDeal(true);
    setRecipient("escrow_funder");
    setFeeMode("with_fee");
    setIsResolving(false);
    onRefetch();
  };

  if (isFetching && appeals.length === 0) {
    return <Loader />;
  }

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>Appeal ID</div>
          <div>Status</div>
          <div>Created</div>
          <div>Creator</div>
          <div>Assignee</div>
          <div>Deal</div>
          <div>Deal Data</div>
          <div>Reason</div>
          <div>Resolution</div>
          <div>Actions</div>
        </div>
        {filteredAppeals.length ? (
          filteredAppeals.map((appeal) => (
            <div className={styles.bodyRow} key={appeal._id}>
              <div className={styles.cell} title={appeal.appealId || appeal._id}>
                {appeal.appealId || appeal._id.slice(0, 8)}
              </div>
              <div className={styles.cell}>
                <span className={getStatusClass(appeal.status)}>{appeal.status || "open"}</span>
              </div>
              <div className={`${styles.cell} ${styles.muted}`} title={appeal.createdAt}>
                {formatDate(appeal.createdAt)}
              </div>
              <div className={styles.cell} title={appeal.creator?.wallet}>
                {appeal.creator?.username || "Unknown"}
              </div>
              <div className={`${styles.cell} ${styles.muted}`} title={appeal.assignedTo?.wallet}>
                {appeal.assignedTo?.username || "Unassigned"}
              </div>
              <div className={styles.cell} title={appeal.deal?._id}>
                {appeal.deal?._id ? (
                  <button
                    type="button"
                    className={styles.dealLink}
                    onClick={() => openDealDetails(appeal.deal?._id)}
                  >
                    {appeal.deal._id.slice(0, 8)}
                  </button>
                ) : (
                  "N/A"
                )}
              </div>
              <div
                className={`${styles.cell} ${styles.muted}`}
                title={`${appeal.deal?.type || "n/a"} | ${appeal.deal?.ticker || "n/a"} | ${appeal.deal?.price ?? "n/a"} | ${appeal.deal?.amount ?? "n/a"}`}
              >
                <span className={getDealTypeClass(appeal.deal?.type)}>
                  {appeal.deal?.type || "buy"}
                </span>
                <span className={styles.tickerCaps}>{String(appeal.deal?.ticker || "n/a")}</span>
                {` / ${appeal.deal?.price ?? "n/a"} / ${appeal.deal?.amount ?? "n/a"}`}
              </div>
              <div className={styles.cell} title={appeal.reason || appeal.description}>
                {appeal.reason || appeal.description || "No reason"}
              </div>
              <div className={`${styles.cell} ${styles.muted}`} title={appeal.resolution}>
                {appeal.resolution || "Not resolved yet"}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionPrimary}`}
                  onClick={() => {
                    if (appeal.supportChatId) {
                      openChat(appeal.supportChatId);
                      return;
                    }
                    handleStartProcess(appeal);
                  }}
                >
                  {appeal.supportChatId ? "Open chat" : "Start process"}
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionSecondary}`}
                  onClick={() => setActiveAppeal(appeal)}
                  disabled={appeal.status === "resolved"}
                >
                  Resolve
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>No appeals found</div>
        )}
      </div>

      {activeAppeal ? (
        <Modal
          title="Resolve Appeal"
          onClose={() => {
            setActiveAppeal(null);
            setResolveDeal(null);
            setIsResolveDealLoading(false);
            setResolveText("");
            setForceCloseDeal(true);
            setRecipient("escrow_funder");
            setFeeMode("with_fee");
          }}
        >
          <div className={styles.modalContent}>
            <textarea
              className={styles.textarea}
              value={resolveText}
              onChange={(e) => setResolveText(e.target.value)}
              placeholder="Describe final decision..."
            />

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={forceCloseDeal}
                onChange={(e) => setForceCloseDeal(e.target.checked)}
              />
              <span className={styles.checkboxCustom} />
              <span>Force close deal after resolution</span>
            </label>

            <div className={styles.label}>Recipient</div>
            <div className={styles.muted} style={{ marginTop: -4, marginBottom: 8 }}>
              Escrow funder ={" "}
              {currentResolveDeal?.type === "sell"
                ? "creator"
                : "buyer (seller in buy-mode deal)"}{" "}
              for this deal type
            </div>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value as "escrow_funder" | "buyer")}
              className={styles.textarea}
              style={{ minHeight: 44 }}
              disabled={!currentResolveDeal && isResolveDealLoading}
            >
              <option value="escrow_funder">
                Escrow funder
                {currentResolveDeal?.type === "sell" ? " (creator)" : " (buyer)"}
              </option>
              <option value="buyer">Buyer</option>
            </select>
            {!currentResolveDeal && isResolveDealLoading ? (
              <div className={styles.muted}>Loading deal participants...</div>
            ) : null}
            {!currentResolveDeal && !isResolveDealLoading ? (
              <div className={styles.muted}>Deal participants are unavailable for this appeal</div>
            ) : null}
            <div className={styles.recipientPreview}>
              <div
                className={`${styles.recipientRow} ${
                  recipient === "escrow_funder" ? styles.recipientRowSelected : ""
                }`}
              >
                <img
                  src={getUserAvatar(escrowFunderUser)}
                  alt={getUserName(escrowFunderUser)}
                  className={styles.recipientAvatar}
                />
                <div className={styles.recipientMeta}>
                  <div className={styles.recipientName}>
                    {getUserName(escrowFunderUser)} <span>(Escrow funder)</span>
                  </div>
                  <div className={styles.recipientWallet}>{getUserWallet(escrowFunderUser)}</div>
                </div>
                <div className={styles.recipientBadge}>
                  {recipient === "escrow_funder" ? "Funds receiver" : "-"}
                </div>
              </div>
              <div
                className={`${styles.recipientRow} ${
                  recipient === "buyer" ? styles.recipientRowSelected : ""
                }`}
              >
                <img
                  src={getUserAvatar(nonFunderUser)}
                  alt={getUserName(nonFunderUser)}
                  className={styles.recipientAvatar}
                />
                <div className={styles.recipientMeta}>
                  <div className={styles.recipientName}>
                    {getUserName(nonFunderUser)} <span>(Non-funder)</span>
                  </div>
                  <div className={styles.recipientWallet}>{getUserWallet(nonFunderUser)}</div>
                </div>
                <div className={styles.recipientBadge}>
                  {recipient === "buyer" ? "Funds receiver" : "-"}
                </div>
              </div>
            </div>

            <div className={styles.label}>Commission mode</div>
            <select
              value={feeMode}
              onChange={(e) => setFeeMode(e.target.value as "with_fee" | "without_fee")}
              className={styles.textarea}
              style={{ minHeight: 44 }}
            >
              <option value="with_fee">With fee</option>
              <option value="without_fee">Without fee</option>
            </select>

            <div className={styles.modalActions}>
              <Button
                type="outlined"
                className={`${styles.modalActionBtn} ${styles.modalCancelBtn}`}
                onClick={() => {
                  setActiveAppeal(null);
                  setResolveDeal(null);
                  setIsResolveDealLoading(false);
                  setResolveText("");
                  setForceCloseDeal(true);
                  setRecipient("escrow_funder");
                  setFeeMode("with_fee");
                }}
              >
                Cancel
              </Button>
              <Button
                type="fill"
                className={`${styles.modalActionBtn} ${styles.modalConfirmBtn}`}
                onClick={handleResolve}
                disabled={isResolving}
              >
                {isResolving ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {isDealModalVisible ? (
        <Modal
          variant="project"
          title="Deal Details"
          onClose={() => {
            setIsDealModalVisible(false);
            setDealDetails(null);
            setIsDealLoading(false);
          }}
        >
          {isDealLoading ? (
            <Loader />
          ) : dealDetails ? (
            <>
              <h3 className={styles.detailSectionTitle}>General</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Deal Id</p>
                  <div className={styles.detailsValue}>{dealDetails._id}</div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Smart Deal ID</p>
                  <div className={styles.detailsValue}>{dealDetails.dealId || "N/A"}</div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Section</p>
                  <div className={styles.detailsValue}>
                    {(dealDetails as any)?.section || "otc"}
                  </div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Status</p>
                  <div className={styles.detailsValue}>{dealDetails.status}</div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Type</p>
                  <div className={styles.detailsValue}>
                    <span className={getDealTypeClass(dealDetails.type)}>{dealDetails.type}</span>
                  </div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Ticker</p>
                  <div className={`${styles.detailsValue} ${styles.tickerCaps}`}>{dealDetails.ticker}</div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Price</p>
                  <div className={styles.detailsValue}>{dealDetails.price}</div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Amount</p>
                  <div className={styles.detailsValue}>{dealDetails.amount}</div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Created</p>
                  <div className={styles.detailsValue}>
                    {formatDate(String((dealDetails as any)?.createDate || ""))}
                  </div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Updated</p>
                  <div className={styles.detailsValue}>
                    {formatDate(String((dealDetails as any)?.lastStatusUpdate || ""))}
                  </div>
                </div>
              </div>

              <h3 className={styles.detailSectionTitle}>Participants</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Creator</p>
                  <div className={styles.detailsValue}>
                    {(dealDetails.creator as any)?.username || "N/A"}
                    <br />
                    {(dealDetails.creator as any)?.wallet || ""}
                    <br />
                    FomoID: {(dealDetails.creator as any)?.fomoId ?? "N/A"}
                    <br />
                    Email: {(dealDetails.creator as any)?.email || "N/A"}
                  </div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Buyer</p>
                  <div className={styles.detailsValue}>
                    {(dealDetails.buyer as any)?.username || "N/A"}
                    <br />
                    {(dealDetails.buyer as any)?.wallet || ""}
                    <br />
                    FomoID: {(dealDetails.buyer as any)?.fomoId ?? "N/A"}
                    <br />
                    Email: {(dealDetails.buyer as any)?.email || "N/A"}
                  </div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Seller</p>
                  <div className={styles.detailsValue}>
                    {((dealDetails as any).seller as any)?.username || "N/A"}
                    <br />
                    {((dealDetails as any).seller as any)?.wallet || ""}
                    <br />
                    FomoID: {((dealDetails as any).seller as any)?.fomoId ?? "N/A"}
                    <br />
                    Email: {((dealDetails as any).seller as any)?.email || "N/A"}
                  </div>
                </div>
                <div className={styles.detailsCard}>
                  <p className={styles.detailsTitle}>Deal Status</p>
                  <div className={styles.detailsValue}>
                    Funds Reserved = {yesNo((dealDetails as any)?.isReservedFunds)}
                    <br />
                    Payment Marked = {yesNo((dealDetails as any)?.isMakePayment)}
                    <br />
                    Appeal Opened = {yesNo((dealDetails as any)?.isAppeal)}
                    <br />
                    Completed by Admin = {yesNo((dealDetails as any)?.isCompleteByAdmin)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.empty}>No details found</div>
          )}
        </Modal>
      ) : null}

      {isChatVisible && userData ? (
        <ChatModal
          isVisible={isChatVisible}
          setIsVisible={setIsChatVisible}
          userData={userData}
          token={token}
          initialChatId={chatId}
        />
      ) : null}
    </>
  );
};

export default AppealsTable;
