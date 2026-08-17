/* eslint-disable */
import React, {FC} from 'react';
import {
    BodyWrapper,
    CardWrapper, DescriptionText, DescriptionWrapper, Footer, FooterItem,
    HeaderCircle,
    HeaderInfoWrapper,
    HeaderTagWrapper,
    HeaderWrapper, InvestorsText, InvestorsWrapper, PercentText, ResultItem, ResultWrapper, TitleText,
    TitleWrapper,
} from "./styles";
import RedFlag from '../Icons/red_flag_icon';
import Typography from '../typography';
import StatusTag from './StatusTag';
import UsersRow from '../UsersRow';
import { IProject } from '../../hooks/useCreateProject';
import loader from '../../services/loader';
import UserAvatar from '../UserAvatar';
import { clarifyAmount } from '../../utils/clarifyAmount';
import { clarifyDate } from '../../utils/clarifyDate';

export interface DefaultCardInterface {
    userAvatar: string;
    userStatus: 'default' | 'warn' | 'success' | 'none';
    userName: string;
    userRating: number;
    variant: 'default' | 'warn';
    headerTag: string;
    status: 'Upcoming' | 'Ended' | 'Active';
    title: string;
    percentage: number;
    description: string;
    investors: {avatar: string, name: string}[];
    redFlagsCount?: number;
    totalAmount: number;
    lastFunding: string;
    type: string;
    className?: string;
    usd?: number;
    btc?: number;
    eth?: number;
}

const DefaultCard: FC<{project:IProject}> = (
    {
        project
    },
) => {

    return (
        <CardWrapper
        >
            <HeaderWrapper>
                <UserAvatar
                    size="medium"
                    variant={'success'}
                    avatar={loader(String(project.logo) || '')}
                    name={project.name}
                    rating={Number(project.rating) || 1}
                />
                <HeaderInfoWrapper>
                    <HeaderTagWrapper>
                        <HeaderCircle />
                        <Typography variant='p'>
                            {project.banner}
                        </Typography>
                    </HeaderTagWrapper>
                    <TitleWrapper>
                        <TitleText variant='p'>
                            {project.name}
                        </TitleText>
                        <PercentText>{project.fullness}</PercentText>
                    </TitleWrapper>
                    <DescriptionWrapper>
                        <DescriptionText variant='p'>
                            {project.bio}
                        </DescriptionText>
                        <StatusTag variant={status.toLowerCase()} />
                    </DescriptionWrapper>
                </HeaderInfoWrapper>
            </HeaderWrapper>
            <BodyWrapper>
                <InvestorsWrapper>
                    <UsersRow users={project.investors || []} />
                    <InvestorsText variant="p">
                        Total: <span>{project.investors?.length} {Number(project.investors?.length) > 1 ? 'persons' : 'person'}</span>
                    </InvestorsText>
                </InvestorsWrapper>
                {/* {(Number(redFlags) || 0) > 0 && <RedFlag count={Number(redFlags)} />} */}
            </BodyWrapper>
            <Footer>
                <FooterItem variant='p'>
                    Total Raised: <br/> <span>${clarifyAmount(Number(project.totalRaised))}</span>
                </FooterItem>
                <FooterItem variant='p'>
                    Last Funding: <br/> <span>{clarifyDate(String(project.lastFunding))}</span>
                </FooterItem>
                <FooterItem variant='p'>
                    Type: <br/> <span>{project.niche}</span>
                </FooterItem>
            </Footer>
            {status === 'Ended' && <ResultWrapper>
                <ResultItem
                    variant='p'
                    amount={0}
                >
                    USD <span>{0}x</span>
                </ResultItem>
                <ResultItem
                    variant='p'
                    amount={0}
                >
                    BTC <span>{0}x</span>
                </ResultItem>
                <ResultItem
                    variant='p'
                    amount={0}
                >
                    ETH <span>{0}x</span>
                </ResultItem>
            </ResultWrapper>}
        </CardWrapper>
    );
};

export default DefaultCard;