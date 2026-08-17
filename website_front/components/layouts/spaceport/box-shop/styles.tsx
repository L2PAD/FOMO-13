import styled from "styled-components";

export const BoxShopWrapper = styled.div`
  width: 100%;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;

  @media (max-width: 768px) {
    margin-top: 20px;
    gap: 20px;
  }

  .label {
    font-size: 14px;
    color: var(--color-text-muted);
    opacity: 1;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-radius: 14px;
  background: #F5FBFD;
  box-shadow: var(--main-section-shadow);

  svg {
    flex-shrink: 0;
  }

  h2 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--main-black);
    margin: 0;
  }

  .counter {
    font-size: 14px;
    color: var(--color-text-muted);
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;

    .result {
      font-size: 24px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
  }

  .subtitle {
    font-size: 14px;
    color: var(--color-text-muted);
    padding: 0;
  }

  .left-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .icon-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .right-section {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .header-switch {
    display: flex;
    align-items: center;
    min-height: 38px;
    border-radius: 8px;

    .bg-switch {
      margin-left: 0;
      max-width: fit-content !important;
      flex: 0 0 auto;
      width: auto;
      min-height: 38px;
      align-items: stretch;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .bg-switch > div {
      min-width: 120px;
      min-height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;

    .subtitle {
      text-align: left;
    }

    .right-section {
      margin-left: 0;
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .header-switch {
      width: 100%;

      .bg-switch {
        max-width: none !important;
        width: 100%;
      }

      .bg-switch > div {
        flex: 1 1 50%;
        min-width: 0;
      }
    }

    .counter {
      align-items: flex-start;
      margin-left: 0;
    }
  }
`;

export const BoxGridWrapper = styled.div`
  width: 100%;
`;

export const SectionTitle = styled.h3`
  display: none;
`;

export const BoxGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

export const BoxCard = styled.div`
  display: grid;
  grid-template-columns: 490px minmax(320px, 1fr);
  gap: 100px;
  padding: 40px 65px;
  background: #f5fbfd;
  border-radius: 12px;
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: var(--main-section-shadow);

  @media (max-width: 1280px) {
    gap: 56px;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 24px;
  }

  @media (max-width: 640px) {
    padding: 18px;
    gap: 20px;
    border-radius: 12px;
  }
`;

export const BoxImageWrapper = styled.div`
  position: relative;
  width: 490px;
  height: 490px;
  max-width: 100%;
  overflow: hidden;
  border-radius: 18px;
  background: #130d24;
  box-shadow: 0 16px 32px rgba(7, 11, 53, 0.18);

  @media (max-width: 1024px) {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .rarity-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: white;
    background: rgba(7, 11, 53, 0.64);
    backdrop-filter: blur(12px);

    &.uncommon {
      background: rgba(7, 11, 53, 0.64);
    }

    &.epic {
      background: rgba(7, 11, 53, 0.64);
    }

    &.legendary {
      background: rgba(7, 11, 53, 0.64);
    }
  }
`;

export const BoxCardContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  min-width: 0;
`;

export const BoxCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  h4 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  p {
    font-size: 14px;
    color: var(--color-text-muted);
    line-height: 1.6;
    margin: 0;
  }
`;

export const BoxInfoPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 18px 16px;
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: var(--main-section-shadow);

  .panel-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .panel-label {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .panel-value {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .panel-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 14px;
    color: var(--color-text-muted);
  }
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e4eef3;
  border-radius: 999px;
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ percentage: number; color: string }>`
  width: ${({ percentage }) => percentage}%;
  height: 100%;
  background: ${({ color }) => color};
  transition: width 0.3s ease;
  border-radius: 999px;
`;

export const DropChances = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: var(--main-section-shadow);

  .title {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 1.2;
  }
`;

export const ProbabilityBar = styled.div`
  width: 100%;
  height: 30px;
  display: flex;
  overflow: hidden;
  border-radius: 999px;
  background: #edf3f7;
`;

export const ProbabilitySegment = styled.div<{ chance: number; background: string }>`
  width: ${({ chance }) => chance}%;
  min-width: ${({ chance }) => (chance > 0 ? "10px" : "0")};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ background }) => background};
  color: var(--color-white);
  font-size: 16px;
  font-weight: var(--font-weight-medium);
`;

export const ProbabilityLegend = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const ProbabilityLegendItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 14px;
  background: var(--color-surface-subtle);

  .legend-name {
    font-size: 16px;
    color: var(--color-text-primary);
  }

  .legend-value {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }
`;

export const BoxPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 18px;
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: var(--main-section-shadow);
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);

  span {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
  }
`;

export const PurchaseWrapper = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(260px, 320px);
  align-items: center;
  gap: 24px;
  padding: 22px 26px;
  background: #f5fbfd;
  border: 1px solid #e4f3f8;
  border-radius: 12px;
  box-shadow: var(--main-section-shadow);

  @media(max-width: 900px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

export const SelectedBoxInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .box-name {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 28px;
    line-height: 1;
    font-weight: var(--font-weight-semibold);
    transition: color 0.2s ease, opacity 0.2s ease;

    &:hover {
      color: var(--color-primary);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  input {
    width: 58px;
    height: 42px;
    text-align: center;
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    background: var(--color-white);
    border: 1px solid var(--color-primary);
    border-radius: 10px;
    box-shadow: 0 8px 18px rgba(7, 11, 53, 0.06);

    &:focus {
      outline: none;
    }
  }
`;

export const TotalPrice = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  .label {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .price {
    font-size: 28px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;

    .savings {
      color: #17b18c;
      font-size: 14px;
      font-weight: var(--font-weight-regular);
    }
  }

  @media(max-width: 768px) {
    width: 100%;
    align-items: flex-start;
  }
`;

export const PurchaseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  width: 100%;
  height: 52px;
  box-shadow: 0 12px 24px rgba(5, 165, 132, 0.2);

  &:hover {
    background: #048c6e;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media(max-width: 768px) {
    width: 100%;
  }
`;

export const InfoSection = styled.div<{ variant?: "info" | "warning" }>`
  border: 1px solid #F0F2F5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);

  .icon-wrapper {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ variant }) =>
    variant === "warning" ? "#fef3c7" : "#E9F8F8"
  };
    border-radius: 50%;
    color: ${({ variant }) => (variant === "warning" ? "#f59e0b" : "#3b82f6")};
  }

  .content {
    flex: 1;

    h4 {
      font-size: 16px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0 0 14px 0;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 2px;

      li {
        font-size: 14px;
        line-height: 1.6;
        color: #728094;
        list-style: disc;
      }
  }
}
`;

export const HowItWorksWrapper = styled.div`
  width: 100%;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 16px;
  box-shadow: var(--main-section-shadow);

  .how-it-works-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);

    svg {
      width: 26px;
      height: 26px;
      color: var(--color-primary);
      flex-shrink: 0;
    }
  }
`;

export const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const StepCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 18px 20px 20px;
  min-height: 156px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  box-shadow: var(--main-section-shadow);

  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    text-align: center;
  }

  .icon-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .icon-bubble {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  .icon-bubble.mint {
    background: #e7faf6;
    color: var(--color-primary);
  }

  .icon-bubble.mint.soft {
    background: #eaf9f7;
  }

  .icon-bubble.neutral {
    background: #f1f5f9;
    color: #7b88a0;
  }

  .icon-bubble.violet {
    background: #efe7ff;
    color: #8b5cf6;
  }

  .icon-bubble.rose {
    background: #ffe9e9;
    color: #ff5a52;
  }

  h5 {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  p {
    font-size: 14px;
    line-height: 1.4;
    color: var(--color-text-muted);
    margin: 0;
  }
`;

export const StepArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);

  svg {
    width: 28px;
    height: 28px;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

export const PossibleRarityBoxesWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }
`;

export const PossibleRarityBoxesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

export const PossibleRarityBoxCard = styled.div`
  background: var(--color-white);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--main-section-shadow);

  .image-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1.2 / 1;
    overflow: hidden;
    background: #dbe7ef;
  }

  .image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .rarity-badge {
    position: absolute;
    top: 20px;
    right: 20px;
    min-width: 94px;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    color: var(--color-white);
    text-align: center;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 22px 20px 24px;
  }

  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .top-row h4 {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .chance-pill {
    min-width: 46px;
    padding: 6px 10px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: var(--font-weight-medium);
    line-height: 1;
    color: var(--color-white);
    text-align: center;
  }

  .drop-chances-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px 20px;
    border-radius: 16px;
    background: #f5fbfd;
    border: 1px solid #e6eef5;
  }

  .drop-title {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    letter-spacing: 0.05em;
    color: var(--main-gray);
  }

  .drop-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .drop-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 14px;
    color: #213056;
  }

  .drop-row strong {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }

  &.uncommon .rarity-badge,
  &.uncommon .chance-pill {
    background: #7d899d;
  }

  &.epic .rarity-badge,
  &.epic .chance-pill {
    background: #8b5cf6;
  }

  &.legendary .rarity-badge,
  &.legendary .chance-pill {
    background: #ff5d5d;
  }
`;

// Unopened Boxes Section
export const UnopenedBoxesWrapper = styled.div`
  width: 100%;
`;

export const UnopenedBoxesHeader = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
`;

export const UnopenedBoxesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const EmptyBoxesState = styled.div`
  width: 100%;
  padding: 28px 24px;
  border-radius: 14px;
  border: 1px solid #e9f8f8;
  background: #f5fbfd;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
`;

export const UnopenedBoxCard = styled.div`
  background: var(--color-white);
  border: 1px solid #eef1f5;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  max-height: 414px;

  &:hover {
    transform: translateY(-4px);
  }

  .info-section {
    padding: 20px;
  }
`;

export const UnopenedBoxImage = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .rarity-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 4px 14px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: white;

    &.uncommon {
      background: #728094;
    }

    &.rare {
      background: #3b82f6;
    }

    &.epic {
      background: #9333ea;
    }

    &.legendary {
      background: var(--color-danger);
    }
  }
`;

export const UnopenedBoxTitle = styled.h4`
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
`;

export const OpenBoxButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px;
  height: 30px;
  background: var(--color-primary);
  color: white;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 20px;
  border-radius: 8px;

  &:hover {
    background: #048c6e;
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Open Box Modal
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 24px;
  padding: 48px;
  max-width: 600px;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

export const ModalCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color 0.2s;

  &:hover {
    color: #0f172a;
  }
`;

export const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

export const NFTImageWrapper = styled.div<{ glowColor: string }>`
  position: relative;
  width: 100%;
  max-width: 280px;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 20px ${({ glowColor }) => glowColor}50,
    0 0 10px ${({ glowColor }) => glowColor}30;
`;

export const NFTImage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const NFTRarityBadge = styled.div<{ rarity: string }>`
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: white;
  background: ${({ rarity }) =>
    rarity === "uncommon"
      ? "#728094"
      : rarity === "rare"
        ? "#3B82F6"
        : rarity === "epic"
          ? "#9333EA"
          : "var(--color-danger)"};
`;

export const NFTName = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .rarity {
    font-size: 14px;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-regular);
  }

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

export const NFTDescription = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
  margin: -16px 0 0 0;
  max-width: 400px;
  font-weight: var(--font-weight-regular);

`;

export const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const ModalButton = styled.button<{ variant: "primary" | "secondary" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  width: fit-content;
  cursor: pointer;
  transition: all 0.2s;
  border: ${({ variant }) =>
    variant === "secondary" ? "1px solid var(--color-primary)" : "none"};
  background: ${({ variant }) =>
    variant === "primary" ? "var(--color-primary)" : "transparent"};
  color: ${({ variant }) => (variant === "primary" ? "white" : "var(--color-primary)")};

  &:hover {
    background: ${({ variant }) =>
    variant === "primary" ? "#048c6e" : "rgba(5, 165, 132, 0.1)"};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
