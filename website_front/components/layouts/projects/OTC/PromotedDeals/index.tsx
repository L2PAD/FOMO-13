import React, { useState, useRef, FC, useEffect, useCallback } from 'react'
import { useQuery } from 'react-query';
import styled, { keyframes } from 'styled-components'
import fetchDeals from '../../../../../http/otc/fetchDeals';
import UserAvatar from '../../../../global/common/UserAvatar';
import imageLoader from '../../../../../helpers/imageLoader';
import sliceAddress from '../../../../../helpers/sliceAddress';
import upperCaseFirstLetter from '../../../../../helpers/upperCaseFirstLetter';
import { IDeal } from '../../../../../types/global_types';
import SponsoredIcon from '../../../../global/Icons/SponsoredIcon';
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from 'swiper';
import Placeholder from '../../../../global/common/Placeholder';
import PromotedDetails from './PromotedDetails';
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";

const Card = styled.div`
    padding: 4px 8px;
    border-radius: 8px;
    background: white;
    border: 1px solid var(--main-blue);
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    transition: all 0.3s ease;
    height: 38px;
`


export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  & .details{
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .type {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    
    &.legendary {
      color: #ff5858;
    }

    &.fomo-gold {
      color: #ffc702;
    }

    &.epic,
    &.rare {
      color: #8a53ff;
    }

    &.buy {
      background: rgba(4, 165, 132, 0.1);
      color: #04a584;
    }

    &.sell {
      background: rgba(255, 88, 87, 0.1);
      color: #FF5857;
    }
  }
  
  .project-info {
    display: flex;
    flex-direction: column;

    h5 {
      font-size: 12px;
    }
  }

  & .sponsored{
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 18px;
    height: 18px;
  }

  & .wallet{
    font-size: 10px;
    font-weight: var(--font-weight-medium);
    color: var(--main-gray);
  }
  
  & .user-avatar-wrapper {
    flex-shrink: 0;
  }
  
  & .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
`;

export const ProjectType = styled.div`
  font-size: 14px;
  color: #738094;
  font-weight: var(--font-weight-regular);
`;

const Wrapper = styled.div`
    display: flex;
    align-items: stretch;
    max-width: 220px;


    @media (max-width:1120px) {
        max-width: 100%;
    }
`

const Items = styled.div<{ isVisible: boolean }>`
    position: relative;
    min-width: 0; 
    transition: all 0.5s ease;
    max-width: ${props => props.isVisible ? '100%' : '0px'};
`;

const smoothGradientFlow = keyframes`
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
`

const AdLabel = styled.button<{ isVisible: boolean }>`
    min-width: 50px;
    max-width: 50px;
    text-align: center;
    background: linear-gradient(
        90deg,
        #0FA4E9,
        #20A7EB,
        #38ADEE,
        #48B0EE,
        #5AB8F0,
        #7478ef,
        #6266F1,
        #696ef3,
        #38ADEE,
        #20A7EB,
        #0FA4E9
    );
    
    background-size: 400% 400%;
    border-radius: 8px;
    padding: 4px 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 20px;
    color: #FFFFFF;
    transition: all 0.3s ease;
    user-select: none;
    border-top-right-radius:${({ isVisible }) => isVisible ? '0px' : '8px'};
    border-bottom-right-radius: ${({ isVisible }) => isVisible ? '0px' : '8px'};
    animation: ${smoothGradientFlow} 10s ease infinite;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: all 0.3s ease;

    &:hover{
        opacity: 0.8;
    }
    &:active{
        opacity: 0.6;
    }

    & .add-text{
        padding: 2px 6px;
        border-radius: 6px;
        background: #FFFFFF33;
    }
`;

interface IProps {
    isSearch: boolean;
    setIsSearch: (value: boolean) => void;
    onVisibilityChange?: (isVisible: boolean) => void;
    isOpen?: boolean;
}

const PromotedDeals: FC<IProps> = ({ isSearch, setIsSearch, onVisibilityChange, isOpen }) => {
    const [dealDetailed, setDealDetailed] = useState<IDeal | null>(null);
    const [isDealDetailsVisible, setIsDealDetailsVisible] = useState<boolean>(false);
    const [internalVisible, setInternalVisible] = useState<boolean>(true);
    const isControlled = typeof isOpen === 'boolean';
    const visible = isControlled ? Boolean(isOpen) : internalVisible;
    const { isLoading, data } = useQuery(
        ['top-deals'],
        () => fetchDeals('all', `?limit=50&offset=0`, 'promoted'),
        {
            refetchOnWindowFocus: false,
            refetchInterval: 1000 * 30,
        }
    );

    const deals = data?.deals || [];
    const swiperRef = useRef<SwiperCore>();
    const isHoveringRef = useRef<boolean>(false);

    const setVisibility = useCallback(
        (next: boolean) => {
            if (visible === next) return;

            if (isControlled) {
                onVisibilityChange?.(next);
            } else {
                setInternalVisible(next);
            }
        },
        [visible, isControlled, onVisibilityChange]
    );

    const handleMouseEnter = () => {
        isHoveringRef.current = true;
        swiperRef.current?.autoplay?.stop();
    };

    const handleMouseLeave = () => {
        isHoveringRef.current = false;
        if (visible) {
            swiperRef.current?.autoplay?.start();
        }
    };

    useEffect(() => {
        if (isSearch && visible) {
            setVisibility(false);
            swiperRef.current?.autoplay?.stop();
        }
    }, [isSearch, visible, setVisibility]);

    useEffect(() => {
        if (!isControlled) {
            onVisibilityChange?.(internalVisible);
        }
    }, [internalVisible, isControlled, onVisibilityChange]);

    useEffect(() => {
        if (visible && !isHoveringRef.current) {
            swiperRef.current?.autoplay?.start();
        } else {
            swiperRef.current?.autoplay?.stop();
        }
    }, [visible]);

    const handleToggle = () => {
        const nextState = !visible;

        if (!visible) {
            setIsSearch(false);
        }

        if (nextState) {
            swiperRef.current?.autoplay?.start();
        } else {
            swiperRef.current?.autoplay?.stop();
        }

        setVisibility(nextState);
    };

    return isLoading ? (
        <Placeholder width='280px' height='37px' marginBottom='0px' />
    ) : (
        <Wrapper>
            <AdLabel isVisible={visible} onClick={handleToggle}>
                <div className='add-text'>Ad</div>
            </AdLabel>
            <Items isVisible={visible}>
                {deals.length > 0 ? (
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{ width: '100%' }}
                    >
                        <Swiper
                            modules={[Autoplay]}
                            spaceBetween={12}
                            autoplay={{
                                delay: 3000,
                                disableOnInteraction: false,
                            }}
                            loop={deals.length > 1}
                            watchOverflow
                            freeMode
                            slidesPerView={1}
                            onSwiper={(swiper: SwiperCore) => {
                                swiperRef.current = swiper;
                            }}
                        >
                            {deals.map((item: IDeal) => (
                                <SwiperSlide
                                    key={item._id}
                                    style={{
                                        marginRight: '0px',
                                    }}
                                >
                                    <Card
                                        onMouseEnter={() => {
                                            setDealDetailed(item);
                                            setIsDealDetailsVisible(true);
                                        }}
                                        onMouseLeave={() => {
                                            setIsDealDetailsVisible(false);
                                            setDealDetailed(null);
                                        }}
                                    >
                                        <CardHeader>
                                            <div className='user-avatar-wrapper'>
                                                <UserAvatar
                                                    avatar={item.creator.photo ? imageLoader(item.creator.photo) : item.creator?.twitterData?.photo}
                                                    size='xSmall'
                                                    variant='default'
                                                    name={item.creator.name}
                                                />
                                            </div>
                                            <div className='user-info'>
                                                <div className='wallet'>{sliceAddress(item.creator.wallet)}</div>
                                                <div className='details'>
                                                    <div className={'type ' + item.type}>{upperCaseFirstLetter(item.type)}</div>
                                                </div>
                                            </div>
                                            <div className='sponsored'>
                                                <SponsoredIcon />
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ) : null}
                <PromotedDetails isVisible={isDealDetailsVisible} deal={dealDetailed} />
            </Items>
        </Wrapper>
    );
};

export default PromotedDeals;