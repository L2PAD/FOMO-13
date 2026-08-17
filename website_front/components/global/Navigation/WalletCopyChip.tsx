import React from "react";
import styled from "styled-components";
import copy from "clipboard-copy";
import { toast } from "react-toastify";
import { CopyIcon } from "../Icons";

const Wrapper = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--main-bg-unactive);
  border: 1px solid var(--main-stroke);
  transition: opacity 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.6;
  }
`;

const LeftSide = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const WalletIconWrapper = styled.div`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const AddressText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
`;

const CopyAction = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--main-gray);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 1;

  svg {
    width: 18px;
    height: 18px;
  }
`;

interface Props {
  address?: string;
}

const formatWalletAddress = (address?: string) => {
  if (!address) return "No wallet";
  if (address.length <= 12) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const WalletCopyChip: React.FC<Props> = ({ address }) => {
  const handleCopy = async () => {
    if (!address) return;

    await copy(address);

    toast.success(
      <div>
        <h3>Copied!</h3>
        <p>Wallet address copied successfully</p>
      </div>
    );
  };

  return (
    <Wrapper type="button" onClick={handleCopy}>
      <LeftSide>
        <WalletIconWrapper>
          <svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.9 0.5H1.9C1.1268 0.5 0.501667 1.29164 0.500947 2.10714C0.5 3.17857 1.1268 4.2381 1.9 4.2381H16.5C17.6046 4.2381 18.5 4.01946 18.5 5.07143V14.2143C18.5 15.4767 17.4255 16.5 16.1 16.5H2.9C1.57452 16.5 0.5 15.4767 0.5 14.2143V2.64286M13.7157 9.62794L13.7 9.64286" stroke="#05A584" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </WalletIconWrapper>
        <AddressText>{formatWalletAddress(address)}</AddressText>
      </LeftSide>

      <CopyAction>
        <CopyIcon fill="var(--main-gray)" />
        <span>Copy</span>
      </CopyAction>
    </Wrapper>
  );
};

export default WalletCopyChip;
