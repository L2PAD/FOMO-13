import styled from "styled-components";

export const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const CartItem = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0px 2px 8px 0px #00053014;

  img {
    width: 80px;
    height: 100px;
    object-fit: cover;
    border-radius: 6px;
  }

  &:last-child {
    border-bottom: 0px;
  }
`;

export const CartCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  cursor: pointer;

  &:indeterminate {
    accent-color: var(--color-primary);
  }
`;

export const CartQuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  margin-right: 20px;

  button {
    width: 24px;
    height: 24px;
    background: transparent;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text-muted);

    &:hover {
      background: #f5f5f5;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  span {
    min-width: 52px;
    height: 33px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
    text-align: center;
    font-weight: var(--font-weight-medium);
  }
`;

export const CartButton = styled.div`
  button {
    width: 24px;
    height: 24px;
    background: transparent;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text-muted);

    &:hover {
      background: var(--color-text-muted)34;
    }

    &:active {
      opacity: 0.6;
    }
  }
`;

export const CartItemInfo = styled.div`
  flex: 1;
  height: 100px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .name {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #0d0f2b;
  }

  .description {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .price {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;

    .original-price {
      font-size: 14px;
      color: var(--color-text-muted);
      text-decoration: line-through;
    }

    .current-price {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: #0d0f2b;
    }
  }
`;

export const CartBody = styled.div`
  position: relative;

  .overflow {
    overflow-x: auto;
  }
`;

export const CartSwitch = styled.div`
  position: absolute;
  top: -34px;
  right: 60px;
`;

export const SelectAllContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 40px 0;

  span {
    font-size: 14px;
    color: var(--color-text-primary);
  }
`;

export const ItemsHeader = styled.div`
  background: #f9f9f9;
  color: var(--color-text-muted);
  padding: 4px 0;
  text-align: center;
`;

export const Item = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;

  span {
    color: var(--color-text-muted);
  }

  p {
    color: #0d0f2b;
    font-weight: var(--font-weight-semibold);
  }

  .left {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .right {
    text-align: right;

    span {
      font-size: 14px;
    }
  }
`;

export const SubmitButton = styled.button`
  padding: 12px 24px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-medium);
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }

  &:disabled {
    cursor: not-allowed;
    background: #999;
  }
`;

export const CartBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;

  .checkout {
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: center;
  }
`;

export const CartLabel = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
`;

export const CartValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  color: #0d0f2b;
`;

export const EmptyCartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
`;

export const EmptyCartIcon = styled.div`
  margin-bottom: 16px;

  svg {
    width: 24px;
    height: 24px;
    color: var(--color-text-muted);
  }
`;

export const EmptyCartText = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #0d0f2b;
  margin-bottom: 12px;
`;

export const EmptyCartSubtext = styled.p`
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.5;
  margin-bottom: 20px;
`;

export const ExploreButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background: var(--color-primary);
    color: white;

    svg path {
      fill: white;
    }
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const RecommendedSection = styled.div`
  margin-top: 32px;
`;

export const RecommendedTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #0d0f2b;
  margin-bottom: 16px;
`;

export const RecommendedItems = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: no-wrap;
  overflow-x: auto;
  gap: 20px;
`;

export const RecommendedItem = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 295px;

  .recommended-item-info {
    padding: 20px;
    background: #f5fbfd;
    border-radius: 0 0 12px 12px;
  }
`;

export const RecommendedItemImage = styled.div`
  position: relative;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  height: 200px;

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .item-number {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: var(--color-white);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
  }
`;

export const RecommendedItemBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  color: ${(props) => {
    if (props.children === "Epic") return "#8B5CF6";
    if (props.children === "FOMO Gold") return "#F59E0B";
    return "var(--color-text-muted)";
  }};
  background: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
`;

export const RecommendedItemFavorite = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
  color: #000;

  &:hover {
    color: #ff6b6b;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const RecommendedItemInfo = styled.div`
  .item-header {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 4px;

    img {
      width: 41px;
      height: 41px;
      border-radius: 50%;
    }
  }
  .name {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #0d0f2b;
    margin-bottom: 4px;
  }

  .category {
    font-size: 14px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }
`;

export const RecommendedItemStats = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: auto;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const RecommendedItemPrice = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .price {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #0d0f2b;
    margin-bottom: 4px;
  }

  .usd-price {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .add-to-cart {
    background: transparent;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-primary);
    border-radius: 6px;

    &:hover {
      background: var(--color-primary);
      color: white;

      svg path {
        fill: white;
      }
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;
