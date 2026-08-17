import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import copy from "clipboard-copy";
import {
    clearStoredP2PPaymentDeadline,
    getDealSeller,
    getRemainingP2PSaleTimeEndSeconds,
    getPaymentDetails,
} from "../helpers";
import { AuthContext, BalanceContext, LoadingContext } from "../../../../../global/Layout";
import { completeDealETH, completeDealUSD } from "../../../../../../smart/smartOTCP2P";
import dealAction from "../../../../../../http/otc/dealAction";
import MakePaymentPreReserveSection from "./MakePaymentPreReserveSection";
import MakePaymentSellerReservedSection from "./MakePaymentSellerReservedSection";
import MakePaymentFlowSection from "./MakePaymentFlowSection";
import { MakePaymentProps } from "./MakePayment.types";

const MakePayment: React.FC<MakePaymentProps> = ({
    deal,
    setStep,
    onAppeal,
    isChatExpanded,
    setIsChatExpanded,
    onReserveFunds,
    onCloseCompletely,
    onMarkPayment,
    onRefetch,
}) => {
    const { userData } = useContext(AuthContext);
    const { loadingStateHandler } = useContext(LoadingContext);
    const balance = useContext(BalanceContext);
    const [timeLeft, setTimeLeft] = useState<number>(getRemainingP2PSaleTimeEndSeconds(deal));
    const [isCompleting, setIsCompleting] = useState(false);
    const [isReturningFunds, setIsReturningFunds] = useState(false);

    if (!deal) {
        return <></>;
    }

    const seller = getDealSeller(deal);
    const paymentDetails = getPaymentDetails(deal);
    const sellerName = seller?.twitterData?.username || seller?.username || "-";
    const buyer = deal.type === "sell" ? deal.buyer : deal.creator;
    const isSeller = seller?._id === userData?._id;
    const isBuyer = buyer?._id === userData?._id;
    const isReservedFunds = !!deal.isReservedFunds;
    const isMakePayment = !!deal.isMakePayment;
    const userBalance = deal.ticker?.toLowerCase() === "eth" ? balance.eth : balance.usdc;

    useEffect(() => {
        if (!isReservedFunds || isMakePayment) return;

        const timer = setInterval(() => {
            setTimeLeft(getRemainingP2PSaleTimeEndSeconds(deal));
        }, 1000);

        setTimeLeft(getRemainingP2PSaleTimeEndSeconds(deal));

        return () => clearInterval(timer);
    }, [isReservedFunds, isMakePayment, deal?._id, deal?.p2pSaleTimeEnd]);

    useEffect(() => {
        if (!deal?._id) return;

        if (!deal.isReservedFunds || deal.status === "ended") {
            clearStoredP2PPaymentDeadline(deal._id);
        }
    }, [deal?._id, deal?.isReservedFunds, deal?.status]);

    const handleCopy = (text: string, label: string) => {
        copy(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleCompleteDeal = async () => {
        if (!deal?.dealId) {
            toast.error("Deal ID is missing");
            return;
        }

        loadingStateHandler(true);
        setIsCompleting(true);

        const { ok }: { ok: boolean } =
            deal.ticker?.toLowerCase() === "eth" ? await completeDealETH(deal.dealId) : await completeDealUSD(deal.dealId);

        if (!ok) {
            toast.error("Smart contract error!");
            setIsCompleting(false);
            loadingStateHandler(false);
            return;
        }

        const { isSuccess } = await dealAction("close", deal._id);

        if (!isSuccess) {
            toast.error("Failed to close deal");
            setIsCompleting(false);
            loadingStateHandler(false);
            return;
        }

        setIsCompleting(false);
        onRefetch?.();
        setStep("completed");
        loadingStateHandler(false);
    };

    const handleReturnFunds = async () => {
        if (!deal?._id || isReturningFunds) return;

        try {
            setIsReturningFunds(true);
            const { isSuccess } = await dealAction("return", deal._id);

            if (!isSuccess) {
                toast.error("Failed to request funds return");
                return;
            }

            toast.success("Funds return requested");
            await onRefetch?.();
        } catch (error) {
            console.error(error);
            toast.error("Failed to request funds return");
        } finally {
            setIsReturningFunds(false);
        }
    };

    if (!isReservedFunds) {
        return (
            <MakePaymentPreReserveSection
                deal={deal}
                isSeller={isSeller}
                sellerName={sellerName}
                isChatExpanded={isChatExpanded}
                setIsChatExpanded={setIsChatExpanded}
                onReserveFunds={onReserveFunds}
            />
        );
    }

    if (isSeller && isReservedFunds && !isMakePayment) {
        return (
            <MakePaymentSellerReservedSection
                deal={deal}
                timeLeft={timeLeft}
                userBalance={userBalance}
                isChatExpanded={isChatExpanded}
                setIsChatExpanded={setIsChatExpanded}
                onCopy={handleCopy}
                onAppeal={() => onAppeal("make-payment")}
                onRefresh={() => onRefetch?.()}
                onReturnFunds={handleReturnFunds}
                isReturningFunds={isReturningFunds}
            />
        );
    }

    return (
        <MakePaymentFlowSection
            deal={deal}
            isMakePayment={isMakePayment}
            isSeller={isSeller}
            isBuyer={isBuyer}
            isChatExpanded={isChatExpanded}
            setIsChatExpanded={setIsChatExpanded}
            timeLeft={timeLeft}
            sellerName={sellerName}
            paymentDetails={paymentDetails}
            onCopy={handleCopy}
            onMarkPayment={onMarkPayment}
            onAppeal={() => onAppeal("make-payment")}
            onCompleteDeal={handleCompleteDeal}
            isCompleting={isCompleting}
            onCloseCompletely={onCloseCompletely}
        />
    );
};

export default MakePayment;
