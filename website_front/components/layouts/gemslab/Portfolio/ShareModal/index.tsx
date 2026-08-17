import React, { FC, useEffect, useState } from "react";
import MainModal from "../../../../global/common/MainModal";
import styled from "styled-components";
import Switch from "../../../../UI/inputs/switch";
import RadioButton from "../../../../global/common/radio_button";
import { Button } from "../../../../global/common/Button";
import { IPortfolio } from "../../../../../types/global_types";
import { toast } from "react-toastify";
import { toggleSharePortfolio } from "../../../../../http/portfolio";

const Wrapper = styled.div``;

const Header = styled.div`
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .info {
    h3 {
      font-size: 16px;
      font-weight: var(--font-weight-semibold);
      margin-bottom: 12px;
    }
    p {
      font-size: 14px;
      color: var(--main-gray);
    }
  }

  @media (max-width: 768px) {
    margin-top: 8px;
  }
`;

const Body = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CheckboxWrapper = styled.div`
  & .item-header {
    display: flex;
    align-items: center;
    gap: 4px;

    & .radio-input {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
    }
  }

  & .item-description {
    margin-top: 12px;
    margin-left: 25px;
    font-size: 14px;
    color: var(--main-gray);
  }
`;

const RefLinkWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  gap: 12px;

  & .input {
    width: 80%;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 9px 8px;
    color: #738094;
    background: white;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .btn-wrapper {
    width: 20%;
    button {
      width: 100%;
    }
  }
`;

interface IProps {
  portfolio: IPortfolio | undefined;
  isVisible: boolean;
  onClose: () => void;
  refetch: () => void;
}

const ShareModal: FC<IProps> = ({ portfolio, isVisible, onClose, refetch }) => {
  const [accessType, setAccessType] = useState<
    "Public Access" | "Private Access"
  >("Private Access");
  const [isShareMode, setIsShareMode] = useState<boolean>(false);

  useEffect(() => {
    if (portfolio) {
      setIsShareMode(!!portfolio.isShare);
      portfolio.isShare && setAccessType(
        portfolio.shareType === "private" ? "Private Access" : "Public Access"
      );
    }
  }, [portfolio]);

  const saveShareSettings = async (isShare: boolean) => {
    if (!portfolio) return;
    setIsShareMode(isShare);

    // Передаём текущий тип доступа
    const shareType = isShare
      ? accessType === "Private Access" ? "private" : "public"
      : null;

    const res = await toggleSharePortfolio(portfolio._id, isShare, shareType);

    if (res.isSuccess) {
      toast.success(
        <div>
          <h3>{isShare ? "Portfolio Shared" : "Portfolio Private"}</h3>
          <p>
            {isShare
              ? `Your portfolio "${portfolio.name}" is now visible according to the selected sharing settings.`
              : `Your portfolio "${portfolio.name}" is now private and cannot be accessed by other users.`}
          </p>
        </div>
      );
      await refetch();
    } else {
      toast.error("Failed to update sharing settings");
    }
  };

  const updateShareType = async (newType: "public" | "private") => {
    if (!portfolio) return;
    setAccessType(newType === "private" ? "Private Access" : "Public Access");

    const res = await toggleSharePortfolio(portfolio._id, true, newType);

    if (res.isSuccess) {
      toast.success(
        <div>
          <h3>Portfolio Shared</h3>
          <p>
            Your portfolio <b>{portfolio.name}</b> is now shared with {newType === "private" ? "private access via link" : "public access"}.
          </p>
        </div>
      );
      await refetch();
    } else {
      toast.error("Failed to update share type");
    }
  };

  const copyLink = () => {
    if (!portfolio?.shareLink) return;
    navigator.clipboard.writeText(portfolio.shareLink);
    toast.success("Link copied!");
  };

  return (
    <MainModal
      variant="820"
      title="Sharing Portfolio"
      isVisible={isVisible}
      onClose={onClose}
    >
      <Wrapper>
        <Header>
          <div className="info">
            <h3>Make your portfolio visible to the community?</h3>
            <p>
              Other users will be able to view your assets, performance, and
              public stats.
            </p>
          </div>
          <Switch
            leftLabel=""
            rightLabel=""
            checked={isShareMode}
            onChange={() => saveShareSettings(!isShareMode)}
          />
        </Header>
      </Wrapper>

      {isShareMode && (
        <Body>
          <CheckboxWrapper>
            <div className="item-header">
              <RadioButton
                infoText=""
                label="Public Access"
                value={accessType}
                onChange={() => updateShareType("public")}
              />
            </div>
            <p className="item-description">
              Visible to all users on the platform. Your portfolio will appear in rankings and search results.
            </p>
          </CheckboxWrapper>

          <CheckboxWrapper>
            <div className="item-header">
              <RadioButton
                infoText=""
                label="Private Access"
                value={accessType}
                onChange={() => updateShareType("private")}
              />
            </div>
            <p className="item-description">
              Only accessible via direct link. Your portfolio will remain hidden from public listings.
            </p>
          </CheckboxWrapper>
        </Body>
      )}

      {isShareMode && accessType === "Private Access" && portfolio?.shareLink && (
        <RefLinkWrapper>
          <div className="input">{portfolio.shareLink}</div>
          <div className="btn-wrapper">
            <Button variant="primary" onClick={copyLink}>
              Copy Link
            </Button>
          </div>
        </RefLinkWrapper>
      )}
    </MainModal>
  );
};

export default ShareModal;
