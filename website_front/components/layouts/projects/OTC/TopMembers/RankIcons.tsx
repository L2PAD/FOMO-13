import React, { FC, useState } from 'react'
import shrimpIcon from '../../../../../assets/icons/otc/rank/1.svg'
import crabIcon from '../../../../../assets/icons/otc/rank/2.svg'
import fishIcon from '../../../../../assets/icons/otc/rank/3.svg'
import dolphinIcon from '../../../../../assets/icons/otc/rank/4.svg'
import sharkIcon from '../../../../../assets/icons/otc/rank/5.svg'
import whaleIcon from '../../../../../assets/icons/otc/rank/6.svg'
import styled from 'styled-components'
import Image from 'next/image'
import DescriptionComponent from '../../../../global/common/DescriptionComponent'


const Wrapper = styled.div`
    position: relative;

    & .rank{
      min-width: 260px;
      padding: 8px;
      div{
        font-size: 14px;
        line-height: 110%;
        color: var(--main-black);
        margin-bottom: 10px;
        font-weight: var(--font-weight-semibold);
      }
      p{
        color: var(--main-gray);
      }
    }
`

const DescriptionWrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: ${({ isVisible }) => (isVisible ? 10 : 1)};
  top: 28px;
  left: -200px;
  pointer-events: none;
`;


const Button = styled.button`

`

export interface RankIconProps {
    rank: 1 | 2 | 3 | 4 | 5 | 6;
    size?: number;
    className?: string;
}

const RankIcon: FC<RankIconProps> = ({
    rank,
    size = 24,
}) => {
    const [isHover, setIsHover] = useState<boolean>(false)
    const icons: any = {
        1: shrimpIcon,
        2: crabIcon,
        3: fishIcon,
        4: dolphinIcon,
        5: sharkIcon,
        6: whaleIcon
    }

    const altTexts: any = {
        1: 'Shrimp',
        2: 'Crab',
        3: 'Fish',
        4: 'Dolphin',
        5: 'Shark',
        6: 'Whale'
    }

    const getRankDescription = (rank: 1 | 2 | 3 | 4 | 5 | 6): string => {
        const descriptions: any = {
            1: `
                <div class="tooltip-title">Shrimp</div>
                <p class="tooltip-description">The smallest players, tiny balances, just starting out in crypto</p>
            `,
            2: `
                <div class="tooltip-title">Crab</div>
                <p class="tooltip-description">
                    Slightly larger holders, no longer 
                    the smallest but still far from mid-tier
                </p>
            `,
            3: `
                <div class="tooltip-title">Fish</div>
                <p class="tooltip-description">
                    Mid-level investors with steady positions in the market
                </p>
            `,
            4: `
                <div class="tooltip-title">Dolphin</div>
                <p class="tooltip-description">
                Noticeable volume traders/holders with solid capital and activity
                </p>
            `,
            5: `
                <div class="tooltip-title">Shark</div>
                <p class="tooltip-description">
                Large, aggressive market players able to impact price movements
                </p>
            `,
            6: `
                <div class="tooltip-title">Whale</div>
                <p class="tooltip-description">
                Top players with massive capital, capable of moving entire markets
                </p>
            `,
        }

        return descriptions[rank]
    }

    return (
        <Wrapper>
            <Button
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
            >
                <Image
                    src={icons[rank]}
                    alt={altTexts[rank]}
                    width={size}
                    height={size}
                />
            </Button>
            <DescriptionWrapper isVisible={isHover}>
                <DescriptionComponent
                    className='rank'
                    isVisible={isHover}
                    date={new Date()}
                    isDate={false}
                    text={getRankDescription(rank)}
                />
            </DescriptionWrapper>
        </Wrapper>
    )
}

const FirstRank = () => <RankIcon rank={1} />
const SecondRank = () => <RankIcon rank={2} />
const ThirdRank = () => <RankIcon rank={3} />
const FourthRank = () => <RankIcon rank={4} />
const FifthRank = () => <RankIcon rank={5} />
const SixthRank = () => <RankIcon rank={6} />

export {
    FirstRank,
    SecondRank,
    ThirdRank,
    FourthRank,
    FifthRank,
    SixthRank,
    RankIcon
}