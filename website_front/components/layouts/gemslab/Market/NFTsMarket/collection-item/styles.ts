import styled from "styled-components";

export const NFTItemWrapper = styled.div`
  height: 400px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  & > img {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    object-fit: contain;
    object-position: top center;
    background: var(--color-white);
  }

  .nft-info {
    display: flex;
    flex-direction: column;
    height: 100%;

    & > div {
      width: 100%;
      height: 100%;
    }

    .project-info h5 {
      font-size: 16px;
    }

    .views {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      height: fit-content;
      margin-left: auto;
      color: var(--color-text-muted);
    }
  }

  .owner-info {
    padding: 20px;
    background: #f5fbfd;
    margin: 0;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;

    & > div {
      margin: 0;
    }
  }
`;

export const Badges = styled.div`
  position: relative;

  .favorite {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-warning);
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      stroke: currentColor;
    }
  }

  .favorite.active {
    color: var(--color-warning);

    svg {
      fill: currentColor;
    }
  }

  .number {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: var(--color-white);
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 14px;
    color: var(--color-text-muted);
  }
  .rarity {
    position: absolute;
    top: 20px;
    right: 20px;
    background: var(--color-white);
    border-radius: 8px;
    padding: 4px 10px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;

    &.legendary {
      color: #ff9800;
    }

    &.epic {
      color: #8338ec;
    }

    &.fomo-gold {
      color: #ffc107;
    }

    &.rare {
      color: #2196f3;
    }
  }
`;
export const Price = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;

  .value {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 16px;

    span {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .actions button,
  .actions a {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .actions button:hover,
  .actions a:hover {
    background: #f5fbfd;
  }

  .actions .cart.active {
    background: var(--color-primary-soft);
  }
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    display: flex;
    width: 100%;
    font-size: 14px;
    justify-content: space-between;
    color: var(--color-text-muted);

    strong {
      color: #333;
      font-weight: var(--font-weight-semibold);
    }
  }
`;
