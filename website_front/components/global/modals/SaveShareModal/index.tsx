import React, { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import clipboardCopy from "clipboard-copy";
import html2canvas from "html2canvas";
import MainModal from "../../common/MainModal";
import Button from "../../common/Button";
import imageLoader from "../../../../helpers/imageLoader";
import SocialLinks from "../../common/SocialLinks";
import LogoFomo from "../../../../assets/images/fomo-l.png";
import {
  BodyWrapper,
  BottomWrapper,
  FakeImg,
  HeaderWrapper,
  SaveButton,
} from "./styles";

interface IProps {
  name?: string;
  link?: string;
  html?: HTMLDivElement | null;
  isVisible: boolean;
  onClose: () => void;
}

interface CaptureElementOptions {
  download?: boolean;
  fileName?: string;
  preserveRenderedSize?: boolean;
}

const waitForStableLayout = async (): Promise<void> => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
};

export const captureElementAsPng = async (
  html: HTMLDivElement,
  {
    download = false,
    fileName = "fomo-screen.png",
    preserveRenderedSize = false,
  }: CaptureElementOptions = {}
): Promise<string> => {
  const watermark = document.createElement("div");
  const img = document.createElement("img");

  img.src = LogoFomo.src;
  img.alt = "Fomo";
  Object.assign(img.style, {
    display: "block",
    width: "88px",
    height: "auto",
  });
  Object.assign(watermark.style, {
    position: "absolute",
    right: "24px",
    bottom: "24px",
    zIndex: "9999",
    padding: "9px 12px",
    border: "1px solid rgba(12, 26, 43, 0.1)",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow: "0 6px 18px rgba(12, 26, 43, 0.12)",
    pointerEvents: "none",
  });
  watermark.appendChild(img);

  const originalPosition = html.style.position;
  if (!originalPosition || originalPosition === "static") {
    html.style.position = "relative";
  }
  html.appendChild(watermark);

  try {
    if (!img.complete) {
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }

    if (preserveRenderedSize) {
      await waitForStableLayout();
    }

    const bounds = html.getBoundingClientRect();
    const captureWidth = Math.max(1, Math.round(bounds.width));
    const captureHeight = Math.max(1, Math.round(bounds.height));
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const maxPixelScale = Math.sqrt(
      20_000_000 / Math.max(1, captureWidth * captureHeight)
    );

    const canvas = await html2canvas(html, {
      backgroundColor: "#ffffff",
      useCORS: true,
      scale: Math.max(1, Math.min(pixelRatio, maxPixelScale)),
      ...(preserveRenderedSize
        ? {
            width: captureWidth,
            height: captureHeight,
            windowWidth: Math.max(window.innerWidth, captureWidth),
            windowHeight: Math.max(window.innerHeight, captureHeight),
            onclone: (_clonedDocument: Document, clonedElement: HTMLElement) => {
              clonedElement.classList.add("chart-screenshot-capture");
              Object.assign(clonedElement.style, {
                boxSizing: "border-box",
                width: `${captureWidth}px`,
                minWidth: `${captureWidth}px`,
                maxWidth: `${captureWidth}px`,
                height: `${captureHeight}px`,
                minHeight: `${captureHeight}px`,
                maxHeight: `${captureHeight}px`,
              });
            },
          }
        : {}),
    });
    const image = canvas.toDataURL("image/png");

    if (download) {
      const link = document.createElement("a");
      link.href = image;
      link.download = fileName;
      link.click();
    }

    return image;
  } finally {
    watermark.remove();
    html.style.position = originalPosition;
  }
};

const SaveShareModal: FC<IProps> = ({
  name,
  link,
  html,
  isVisible,
  onClose,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onCopyLink = () => {
    clipboardCopy(link || "");
    toast.success(
      <div>
        <h3>Success!</h3>
        <p>Link copied!</p>
      </div>
    );
  };

  const handleSaveImage = async () => {
    if (!html) return;

    try {
      const image = await captureElementAsPng(html, { download: true });
      setImageSrc(image);
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Failed to capture the screenshot.");
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    const saveImageSrc = async () => {
      if (!html) return;

      try {
        setImageSrc(await captureElementAsPng(html));
      } catch (error) {
        console.error("Error preparing screenshot preview:", error);
        toast.error("Failed to capture the screenshot.");
      }
    };

    saveImageSrc();
  }, [html, isVisible]);

  const modal = (
    <MainModal
      className="share-modal"
      variant="big"
      title={name || "“Name of Table/Graph”"}
      isVisible={isVisible}
      onClose={onClose}
    >
      <BodyWrapper>
        <HeaderWrapper>
          <input
            value={link}
            placeholder="https://www.fomo.cx/crypto/project/6762f6abfa77f29fe7cade24"
          />
          <Button onClick={onCopyLink} className="copy-link" variant="main">
            Copy Link
          </Button>
        </HeaderWrapper>

        {imageSrc ? (
          <FakeImg src={imageSrc} alt="Graph Screenshot" />
        ) : (
          <FakeImg src={imageLoader("/fake-img.png")} alt="fake image" />
        )}

        <BottomWrapper>
          <div className="share-label">Share</div>
          <SocialLinks
            links={[
              {
                href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link || "")}`,
                key: "x",
              },
              {
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link || "")}`,
                key: "fs",
              },
              {
                href: `https://t.me/share/url?url=${encodeURIComponent(link || "")}`,
                key: "tg",
              },
            ]}
          />
          <SaveButton onClick={handleSaveImage}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="14"
              viewBox="0 0 13 14"
              fill="none"
            >
              <path
                d="M1.16699 12.5885C1.4368 12.852 1.80273 13 2.18429 13H10.8164C11.1979 13 11.5639 12.852 11.8337 12.5885M6.50113 1V8.96164M6.50113 8.96164L9.78953 5.91953M6.50113 8.96164L3.21272 5.91953"
                stroke="#04A584"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Save
          </SaveButton>
        </BottomWrapper>
      </BodyWrapper>
    </MainModal>
  );

  if (!isMounted) return null;

  return createPortal(modal, document.body);
};

export default SaveShareModal;
