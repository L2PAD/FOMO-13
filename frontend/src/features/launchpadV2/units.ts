import { BigNumber, BigNumberish, utils } from "ethers";

const assertDecimals = (decimals: number): void => {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error("Token decimals must be an integer from 0 to 255");
  }
};

/** Converts a human decimal string to an exact raw uint string. */
export const parseTokenAmount = (value: string, decimals: number): string => {
  assertDecimals(decimals);

  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(normalized)) {
    throw new Error("Token amount must be a non-negative decimal string");
  }

  return utils.parseUnits(normalized, decimals).toString();
};

/** BigNumber variant for direct ethers calls. */
export const parseTokenAmountBigNumber = (value: string, decimals: number): BigNumber =>
  BigNumber.from(parseTokenAmount(value, decimals));

/** Converts an exact raw uint value into a human decimal string. */
export const formatTokenAmount = (raw: BigNumberish, decimals: number): string => {
  assertDecimals(decimals);
  return utils.formatUnits(BigNumber.from(raw), decimals);
};
