import React, { FC } from "react";
import { BaseCardCryptoWrapper, BaseCardWrapper } from "./styles";

export type BaseCardVariant =
  | "default"
  | "warn"
  | "success"
  | "none"
  | "main"
  | "crypto"
  | "spotlight";

export interface BaseCardInterface {
  tabIndex?: number;
  children: any;
  variant: BaseCardVariant;
  className?: string;
  onClick?: (e?: any) => void;
  draggable?: boolean;
}

const BaseCard: FC<BaseCardInterface> = ({
  draggable,
  children,
  variant,
  className,
  onClick,
  tabIndex,
}) => {
  return variant === "crypto" ? (
    <BaseCardCryptoWrapper
      data-card-variant={variant}
      tabIndex={tabIndex || 0}
      variant={variant}
      className={className}
      onClick={onClick}
      draggable={draggable}
    >
      {children}
    </BaseCardCryptoWrapper>
  ) : (
    <BaseCardWrapper
      data-card-variant={variant}
      tabIndex={tabIndex || 0}
      variant={variant}
      className={className}
      onClick={onClick}
      draggable={draggable}
    >
      {children}
    </BaseCardWrapper>
  );
};

export default BaseCard;
