import React from "react";
import { Copy } from "lucide-react";
import { useTranslation } from "i18n";
import sliceAddress from "../../../../helpers/sliceAddress";
import {
  Address,
  ContractButton,
  ContractMeta,
  ContractsList,
  Header,
  Status,
  Title,
  Wrapper,
} from "./styles";

interface SmartContractItem {
  contract?: string;
  address?: string;
  networkImage?: string;
  networkName?: string;
  chain?: string;
}

interface SmartContractsProps {
  contracts?: SmartContractItem[];
  onCopy?: (value: string) => void;
  title?: string;
  className?: string;
}

const getAddress = (item: SmartContractItem): string =>
  String(item?.contract || item?.address || "").trim();

const SmartContracts: React.FC<SmartContractsProps> = ({
  contracts = [],
  onCopy,
  title = "Smart contracts",
  className,
}) => {
  const { translateText } = useTranslation();
  const validContracts = contracts.filter((item) => getAddress(item));
  const hasContracts = validContracts.length > 0;

  return (
    <Wrapper className={className}>
      <Header>
        <Title>{translateText(title)}</Title>
        <Status $active={hasContracts}>
          {translateText(hasContracts ? "Supported" : "Unknown")}
        </Status>
      </Header>
      {hasContracts ? (
        <ContractsList>
          {validContracts.slice(0, 3).map((item) => {
            const address = getAddress(item);
            const networkName = String(item.networkName || item.chain || "Network");

            return (
              <ContractButton
                key={`${networkName}-${address}`}
                type="button"
                aria-label={`${translateText("Copy contract address")} ${address}`}
                data-address={address}
                onClick={() => onCopy?.(address)}
              >
                <ContractMeta>
                  {item.networkImage ? (
                    <img src={item.networkImage} alt={networkName} />
                  ) : null}
                  <strong>{networkName}</strong>
                </ContractMeta>
                <Address>{sliceAddress(address)}</Address>
                <Copy />
              </ContractButton>
            );
          })}
        </ContractsList>
      ) : null}
    </Wrapper>
  );
};

export default SmartContracts;
