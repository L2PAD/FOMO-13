import React, { FC, useContext, useState } from "react";
import {
  CopyIcon,
  DiscordIcon,
  TelegramIcon,
  TwitterIcon,
} from "../../Icons";
import { InputWrapper, SocialsWrapper } from "./styles";
import copy from "clipboard-copy";
import { useDealSharing } from "../../../../hooks/useDealSharing";
import { IDeal, IOtcMember } from "../../../../types/global_types";
import MainModal from "../../common/MainModal";
import { makeScreenshot } from "../../../../http/deals/makeDealScreenshot";
import imageLoader from "../../../../helpers/imageLoader";
import { toast } from "react-toastify";
import { LoadingContext } from "../../Layout";

interface Props {
  isVisible?: boolean;
  link?: string;
  data?: IDeal | IOtcMember | null;
  activeTab?: string;
  type?: "deal" | "member";
  section?: "otc" | "p2p";
  onClose: () => void;
}

const ShareModal: FC<Props> = ({
  onClose,
  isVisible,
  link = "",
  data,
  type = "deal",
  activeTab,
  section,
}) => {
  const { shareDeal, generateDealLink } = useDealSharing();
  const [imageLink, setImageLink] = useState("");
  const { loadingStateHandler } = useContext(LoadingContext);

  const shareLink = (() => {
    const generatedLink = data?._id
      ? generateDealLink(data._id, activeTab, section)
      : link;

    if (!generatedLink) {
      return "";
    }

    if (/^(?:[a-z]+:)?\/\//i.test(generatedLink)) {
      return generatedLink;
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}${generatedLink}`;
    }

    return generatedLink;
  })();

  const handleScreenshot = async (): Promise<string | null> => {
    if (!data?._id) return null;

    if (imageLink) {
      return imageLink;
    }

    loadingStateHandler(true);

    try {
      const result = await makeScreenshot(data._id);

      if (result.isSuccess && result.url) {
        const generatedImageLink = imageLoader(result.url);
        setImageLink(generatedImageLink);
        loadingStateHandler(false);
        return generatedImageLink;
      }

      toast.error("Screenshot generation limit reached");
      loadingStateHandler(false);
      return null;
    } catch (error) {
      toast.error("Error generating screenshot");
      loadingStateHandler(false);
      return null;
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;

    await copy(shareLink);
    toast.success("Link copied to clipboard!");
  };

  const shareToTelegram = async () => {
    const currentImageLink = await handleScreenshot();
    const text = `Check out this ${type} on FOMO.CX: `;

    if (!shareLink || typeof window === "undefined") return;

    let url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}`;

    url += `&text=${encodeURIComponent(
      currentImageLink ? `${text}\n\n${currentImageLink}` : text
    )}`;

    window.open(url, "width=600,height=400");
  };

  const shareToTwitter = async () => {
    const currentImageLink = await handleScreenshot();

    if (!shareLink || typeof window === "undefined") return;

    const text = currentImageLink
      ? `Check out this ${type} on FOMO.CX: \n\n рџ–јпёЏ Image: ${currentImageLink}`
      : `Check out this ${type} on FOMO.CX: `;

    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;

    window.open(url, "width=600,height=400");
  };

  const shareToDiscord = async () => {
    const currentImageLink = await handleScreenshot();

    if (!shareLink) return;

    let shareText = `**${"Check out this one on FOMO.CX"}**\n\n`;
    shareText += `рџ”— ${shareLink}`;

    if (currentImageLink) {
      shareText += `\n\nрџ–јпёЏ ${currentImageLink}`;
    }

    await copy(shareText);
    toast.success("Info with image copied! You can now paste it in Discord");
  };

  const handleCopyWithScreenshot = async () => {
    if (!data?._id) {
      await copyShareLink();
      return;
    }

    const currentImageLink = await handleScreenshot();
    if (!currentImageLink) return;

    await copy(currentImageLink);
    toast.success("Screenshot link copied!");
  };

  return (
    <MainModal
      isVisible={!!isVisible}
      variant="small-medium"
      title="Share"
      onClose={() => {
        onClose();
        setImageLink("");
      }}
    >
      <InputWrapper>
        <p>Link to image</p>

        <input
          disabled={!!imageLink}
          onClick={handleCopyWithScreenshot}
          placeholder={imageLoader("/img.png")}
          type="text"
          value={imageLink || ""}
          readOnly
        />

        <button onClick={handleCopyWithScreenshot}>
          <CopyIcon fill="#04A584" />
        </button>
      </InputWrapper>

      <InputWrapper>
        <p>Link</p>
        <input type="text" value={shareLink} readOnly />
        <button
          onClick={async () => {
            if (data?._id) {
              await shareDeal(data._id, activeTab, section);
            } else {
              await copyShareLink();
            }

            onClose();
          }}
        >
          <CopyIcon fill="#04A584" />
        </button>
      </InputWrapper>

      <InputWrapper>
        <p>Share with</p>
        <SocialsWrapper>
          <button onClick={shareToTelegram}>
            <TelegramIcon fill="#00C099" />
          </button>
          <button onClick={shareToTwitter}>
            <TwitterIcon fill="#00C099" />
          </button>
          <button onClick={shareToDiscord}>
            <DiscordIcon fill="#00C099" />
          </button>
        </SocialsWrapper>
      </InputWrapper>
    </MainModal>
  );
};

export default ShareModal;
