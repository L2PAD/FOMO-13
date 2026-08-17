import React, { FC, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import Modal from "../../../../../global/common/Modal";
import mock2 from "../../../../../../assets/images/nft/shark.png";
import { resolveMediaUrl } from "../helpers";
import {
  ButtonsWrapper,
  Container,
  CurrencyArrow,
  CurrencyDropdown,
  CurrencyOption,
  CurrencySelectButton,
  CurrencySelectContainer,
  DescriptionText,
  DoneButton,
  ErrorText,
  HighlightText,
  InfoGrid,
  InfoLabel,
  InfoRow,
  InfoValue,
  ModalContent,
  NFTImageWrapper,
  PriceInput,
  PriceInputWrapper,
  PriceLabel,
  PriceSection,
  PriceUSD,
  SubmitButton,
  SuccessContent,
  SuccessMessage,
  CancelButton,
} from "./styles";
import { useTranslation } from "i18n";

type OfferCurrency = "USDC" | "ETH";
type ModalState = "offer" | "success";

interface Props {
  onClose: () => void;
  onSubmit: (payload: {
    price: number;
    currency: OfferCurrency;
  }) => Promise<boolean>;
  isSubmitting?: boolean;
  defaultCurrency?: OfferCurrency;
  ethUsdRate?: number;
  nftImage?: unknown;
  nftName?: string;
}

const MakeOfferModal: FC<Props> = ({
  onClose,
  onSubmit,
  isSubmitting = false,
  defaultCurrency = "ETH",
  ethUsdRate = 0,
  nftImage = mock2,
  nftName = "Molten Guardian",
}) => {
  const { t } = useTranslation();
  const [modalState, setModalState] = useState<ModalState>("offer");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<OfferCurrency>(defaultCurrency);
  const [error, setError] = useState("");
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [submittedOffer, setSubmittedOffer] = useState<{
    price: number;
    currency: OfferCurrency;
  } | null>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrency(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
      setError("");
    }
  };

  const validatePrice = () => {
    const priceValue = Number(price);

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setError(t("nftMarket.offer.invalidPrice"));
      return null;
    }

    setError("");
    return priceValue;
  };

  const handleSubmit = async () => {
    const normalizedPrice = validatePrice();

    if (!normalizedPrice || isSubmitting) {
      return;
    }

    const isSuccess = await onSubmit({
      price: normalizedPrice,
      currency,
    });

    if (!isSuccess) {
      return;
    }

    setSubmittedOffer({
      price: normalizedPrice,
      currency,
    });
    setModalState("success");
  };

  const getUsdPreview = () => {
    const priceValue = Number(price);

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      return null;
    }

    if (currency === "USDC") {
      return priceValue;
    }

    const rate = Number(ethUsdRate || 0);
    return rate > 0 ? priceValue * rate : null;
  };

  const usdPreview = getUsdPreview();

  return (
    <Container>
      <Modal
        onClose={onClose}
        title={modalState === "success" ? t("nftMarket.offer.lockedIn") : t("nftMarket.offer.make")}
        className="make-offer"
      >
        {modalState === "success" ? (
          <SuccessContent>
            <SuccessMessage>
              {t("nftMarket.offer.successMessage")}
            </SuccessMessage>

            <InfoGrid>
              <InfoRow>
                <InfoLabel>{t("nftMarket.offer.status")}</InfoLabel>
                <InfoValue className="success">{t("nftMarket.offer.statusLabel.active")}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>NFT</InfoLabel>
                <InfoValue>{nftName}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>{t("nftMarket.offer.offer")}</InfoLabel>
                <InfoValue>{submittedOffer?.price || 0}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>{t("common.labels.currency", { defaultValue: "Currency" })}</InfoLabel>
                <InfoValue>{submittedOffer?.currency || currency}</InfoValue>
              </InfoRow>
            </InfoGrid>

            <DoneButton onClick={onClose}>{t("nftMarket.offer.done")}</DoneButton>
          </SuccessContent>
        ) : (
          <ModalContent>
            <NFTImageWrapper>
              <img src={resolveMediaUrl(nftImage)} alt={nftName} />
            </NFTImageWrapper>

            <PriceSection>
              <PriceLabel>{t("nftMarket.offer.price")}</PriceLabel>
              <PriceInputWrapper hasError={!!error}>
                <PriceInput
                  type="text"
                  placeholder={t("nftMarket.offer.enterPrice")}
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={validatePrice}
                />
                <CurrencySelectContainer ref={currencyRef}>
                  <CurrencySelectButton
                    type="button"
                    isOpen={isCurrencyOpen}
                    onClick={() => setIsCurrencyOpen((prev) => !prev)}
                  >
                    {currency}
                    <CurrencyArrow isOpen={isCurrencyOpen}>
                      <ChevronDown />
                    </CurrencyArrow>
                  </CurrencySelectButton>
                  <CurrencyDropdown isOpen={isCurrencyOpen}>
                    <CurrencyOption
                      type="button"
                      isSelected={currency === "USDC"}
                      onClick={() => {
                        setCurrency("USDC");
                        setIsCurrencyOpen(false);
                      }}
                    >
                      USDC
                    </CurrencyOption>
                    <CurrencyOption
                      type="button"
                      isSelected={currency === "ETH"}
                      onClick={() => {
                        setCurrency("ETH");
                        setIsCurrencyOpen(false);
                      }}
                    >
                      ETH
                    </CurrencyOption>
                  </CurrencyDropdown>
                </CurrencySelectContainer>
              </PriceInputWrapper>
              {error ? <ErrorText>{error}</ErrorText> : null}
              {usdPreview !== null ? (
                <PriceUSD>${usdPreview.toFixed(2)}</PriceUSD>
              ) : null}
            </PriceSection>

            <DescriptionText>
              <HighlightText>{t("nftMarket.offer.descriptionPrefix")}</HighlightText>{" "}
              {t("nftMarket.offer.descriptionBody")}{" "}
              <HighlightText>{t("nftMarket.offer.descriptionAction")}</HighlightText>{" "}
              {t("nftMarket.offer.descriptionSuffix")}
            </DescriptionText>

            <ButtonsWrapper>
              <CancelButton onClick={onClose} type="button">
                {t("common.actions.close")}
              </CancelButton>
              <SubmitButton
                disabled={isSubmitting}
                onClick={handleSubmit}
                type="button"
              >
                {isSubmitting ? t("nftMarket.offer.submitting") : t("nftMarket.offer.offerToBuy")}
              </SubmitButton>
            </ButtonsWrapper>
          </ModalContent>
        )}
      </Modal>
    </Container>
  );
};

export default MakeOfferModal;
