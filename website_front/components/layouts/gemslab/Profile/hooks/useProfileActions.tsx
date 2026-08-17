import React from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import copy from "clipboard-copy";
import copyRefLink from "../../../../../http/user/copyRefLink";
import { useTranslation } from "i18n";

const showCopiedToast = (title: string, message: string) => {
  toast.success(
    <div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
};

export const useProfileActions = (userData: any) => {
  const { translateText } = useTranslation();
  const router = useRouter();

  const copyReferralLink = async (): Promise<void> => {
    const refLink = await copyRefLink();
    copy(refLink);

    showCopiedToast(
      translateText("Copied!"),
      translateText("You have succesfuly copied a referral link")
    );
  };

  const copyWallet = (): void => {
    copy(userData?.wallet);

    showCopiedToast(
      translateText("Copied!"),
      translateText("You have succesfuly copied a wallet address")
    );
  };

  const copyFomoId = (): void => {
    copy(String(userData?.fomoId || 0));

    showCopiedToast(
      translateText("Copied!"),
      translateText("You have succesfuly copied your FOMO ID")
    );
  };

  const openClink = (): void => {
    router.push("/core/fomo-chat?tab=clink");
  };

  return {
    copyReferralLink,
    copyWallet,
    copyFomoId,
    openClink,
  };
};
