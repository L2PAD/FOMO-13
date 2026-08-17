import React, { useEffect, useMemo, useState } from "react";
import {
  ApproveBtn,
  ModalAmountBox,
  ModalAmountLabel,
  ModalCard,
  ModalHeader,
  ModalIconCircle,
  ModalOverlay,
  ModalSubtitle,
  ModalTitle,
  ModalTitleGroup,
  ModalViewBtn,
} from "./styles";
import { IconLayers } from "../../../global/Icons/Launchpad/icons";

interface NftStakeSelectionModalProps {
  tokenIds: bigint[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (tokenIds: bigint[]) => void;
}

const NftStakeSelectionModal: React.FC<NftStakeSelectionModalProps> = ({
  tokenIds,
  isPending,
  onClose,
  onConfirm,
}) => {
  const availableIds = useMemo(() => tokenIds.map(String), [tokenIds]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const available = new Set(availableIds);
    setSelectedIds((current) => new Set(
      Array.from(current).filter((tokenId) => available.has(tokenId))
    ));
  }, [availableIds]);

  const toggleToken = (tokenId: string) => {
    if (isPending) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(tokenId)) next.delete(tokenId);
      else next.add(tokenId);
      return next;
    });
  };

  const selectedTokenIds = availableIds
    .filter((tokenId) => selectedIds.has(tokenId))
    .map(BigInt);

  return (
    <ModalOverlay onClick={() => !isPending && onClose()}>
      <ModalCard onClick={(event) => event.stopPropagation()}>
        <ModalHeader>
          <ModalIconCircle><IconLayers color="#05a584" /></ModalIconCircle>
          <ModalTitleGroup>
            <ModalTitle>Select FOMO NFTs</ModalTitle>
            <ModalSubtitle>Choose only the NFTs you want to stake in this pool.</ModalSubtitle>
          </ModalTitleGroup>
        </ModalHeader>

        <ModalAmountBox style={{ alignItems: "stretch", maxHeight: 280, overflowY: "auto" }}>
          {availableIds.length === 0 ? (
            <ModalAmountLabel>No wallet-owned or reusable NFTs are available.</ModalAmountLabel>
          ) : availableIds.map((tokenId) => (
            <label
              key={tokenId}
              style={{
                alignItems: "center",
                cursor: isPending ? "default" : "pointer",
                display: "flex",
                gap: 10,
                justifyContent: "space-between",
                padding: "8px 4px",
              }}
            >
              <span>FOMO NFT #{tokenId}</span>
              <input
                type="checkbox"
                checked={selectedIds.has(tokenId)}
                disabled={isPending}
                onChange={() => toggleToken(tokenId)}
              />
            </label>
          ))}
        </ModalAmountBox>

        <div style={{ display: "flex", gap: 10 }}>
          <ModalViewBtn type="button" disabled={isPending} onClick={onClose}>
            Cancel
          </ModalViewBtn>
          <ApproveBtn
            type="button"
            disabled={isPending || selectedTokenIds.length === 0}
            onClick={() => onConfirm(selectedTokenIds)}
          >
            {isPending ? "Processing…" : `Stake ${selectedTokenIds.length || ""} NFT${selectedTokenIds.length === 1 ? "" : "s"}`}
          </ApproveBtn>
        </div>
      </ModalCard>
    </ModalOverlay>
  );
};

export default NftStakeSelectionModal;
