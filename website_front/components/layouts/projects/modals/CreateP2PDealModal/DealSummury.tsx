import React, { FC, useMemo } from "react";
import styled from "styled-components";
import { DealInputLabel } from "./styles";
import upperCaseFirstLetter from "../../../../../helpers/upperCaseFirstLetter";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";

const Wrapper = styled.div`
    margin: 16px 0;
`;

const Body = styled.div<{ type: "buy" | "sell" }>`
    position: relative;
    width: 100%;
    padding: 12px 14px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

const Item = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Title = styled.span`
    font-size: 12px;
    color: var(--main-gray);
    font-weight: var(--font-weight-regular);
`;

const Value = styled.span`
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    color: #070b35;
`;

const TypeBadge = styled.div<{ type: "buy" | "sell" }>`
    align-self: flex-start;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    color: ${({ type }) => type === "buy" ? "var(--main-green)" : "var(--main-red)"};
    background: ${({ type }) =>
        type === "buy" ? "#e6f8ef" : "#fdeaea"};
`;

const Divider = styled.button`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);

    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;

    &:hover{
        opacity: 0.6;
    }

    &:active{
        opacity: 0.4;
    }

    svg{
        width: 32px;
        height: 32px;
    }
`;

interface DealSummaryProps {
    type: "buy" | "sell";
    amount: number;
    price: number;
    token: string;
    currency: string;
    onReplace: () => void
}

const DealSummary: FC<DealSummaryProps> = ({
    type,
    amount,
    price,
    token,
    currency,
    onReplace
}) => {
    const pricePerToken = useMemo(() => {
        if (!amount) return 0;
        return price / amount;
    }, [price, amount]);

    const format = (v: number) =>
        new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2,
        }).format(v);

    return (
        <Wrapper>
            <DealInputLabel>Deal Summary</DealInputLabel>

            <Body type={type}>
                <Item>
                    <TypeBadge type={type}>
                        {upperCaseFirstLetter(type)}
                    </TypeBadge>
                    <Value>
                        {clarifyAmount(amount)} {token}
                    </Value>
                </Item>

                <Divider
                onClick={onReplace}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.99844 19.2005C4.01021 19.2005 2.39844 17.5887 2.39844 15.6005V8.40039C2.39844 6.41217 4.01021 4.80039 5.99844 4.80039H11.3984M16.1984 4.80039H17.9984C19.9867 4.80039 21.5984 6.41217 21.5984 8.40039V15.6005C21.5984 17.5887 19.9867 19.2005 17.9984 19.2005H10.1984M10.1984 19.2005L12.5984 16.8004M10.1984 19.2005L12.5984 21.6004M10.1984 7.20039L12.5984 4.80039L10.1984 2.40039" stroke="#738094" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </Divider>

                <Item>
                    <Title>Price per token</Title>
                    <Value>
                        {format(pricePerToken)} {currency}
                    </Value>
                </Item>
            </Body>
        </Wrapper>
    );
};

export default DealSummary;
