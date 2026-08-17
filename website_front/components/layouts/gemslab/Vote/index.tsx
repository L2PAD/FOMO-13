import React, { useState } from "react";
import {
  DataCard,
  CardsWrapper,
  DataWrapper,
  Card,
  PageWrapper,
  SearchWrapper,
  UpcomingCard,
  Table,
} from "./style";
import Typography from "../../../global/common/Typography";
import { PageDescription } from "../News/styles";
import { SearchIconStyle, SearchInput } from "../../projects/Networks/styles";
import SpeedIcon from "../../../global/Icons/SpeedIcon";
import VoteIcon from "../../../global/Icons/VoteIcon";
import Pagination from "../../../global/Pagintaion";
import ConnectWalletModal from "../../../global/modals/ConnectWalletModal";
import VoteModal from "../../../global/modals/VoteModal";

const proposalData = [
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Open",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Open",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Open",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Open",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Open",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Open",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
];

const ProposalCardList = () => {
  const [voteModal, setVoteModal] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState(-1);

  const handleToggleMore = (index: number) => {
    setExpandedProposal((prevIndex) => (prevIndex === index ? -1 : index));
  };

  return (
    <Card variant="default">
      <b>Open proposals</b>
      <div className="b-line" />
      {proposalData.map((proposal, index) => (
        <React.Fragment key={index}>
          <div
            className="flex"
            onClick={() => handleToggleMore(index)}
            style={{ cursor: "pointer" }}
          >
            <div>
              <p>{proposal.title}</p>
              <span>{proposal.date}</span>
            </div>
            <div>
              <b>{proposal.status}</b>
              <br />
              <span className="green">VOTES: {proposal.votes}</span>
            </div>
          </div>
          {expandedProposal === index && (
            <div className="more">
              <pre>{proposal.description}</pre>
              <center>
                <b>Add your voice</b>
                <div className="button" onClick={() => setVoteModal(true)}>
                  Contribute a vote{" "}
                </div>
              </center>
            </div>
          )}
          <div className="line" />
        </React.Fragment>
      ))}
      {voteModal && (
        <VoteModal
          onClose={() => {
            setVoteModal(false);
          }}
        />
      )}
    </Card>
  );
};

const concludedProposalData = [
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Closed",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Closed",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Closed",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Closed",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    date: "Posted December 16th 2022",
    status: "Closed",
    votes: 9,
    description: `With this proposal, Noname aims to empower the community to choose what percentage of the total NFT key
    should be burnt in January 2023 before the NN 3.0 go-live. The below options have been chosen based on
    different community feedback.
    
    Voting Start - 2nd Jan
    
    Voting End - 16th Jan
    
    The Great Burn - 31th Jan`,
  },
];

const ConcludedProposalsCard = () => {
  const [walletModal, setWalletModal] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState(-1);
  const [concludedPage, setConcludedPage] = useState(1);

  const handleToggleMore = (index: number) => {
    setExpandedProposal((prevIndex) => (prevIndex === index ? -1 : index));
  };

  return (
    <Card variant="default">
      <h2>Concluded proposals</h2>
      <div className="b-line" />
      {concludedProposalData.map((proposal, index) => (
        <React.Fragment key={index}>
          <div
            className="flex"
            onClick={() => handleToggleMore(index)}
            style={{ cursor: "pointer" }}
          >
            <div>
              <p>{proposal.title}</p>
              <span>{proposal.date}</span>
            </div>
            <div>
              <b>{proposal.status}</b>
              <br />
              <span className="green">VOTES: {proposal.votes}</span>
            </div>
          </div>
          {expandedProposal === index && (
            <div className="more">
              <pre>{proposal.description}</pre>
              <center>
                <b>Add your voice</b>
                <div className="button" onClick={() => setWalletModal(true)}>
                  Connect wallet
                </div>
              </center>
            </div>
          )}
          <div className="line" />
        </React.Fragment>
      ))}
      <div className="pagination">
        <Pagination
          page={concludedPage}
          total={20}
          limit={100}
          totalPage={20}
          onChange={(value) => setConcludedPage(value)}
        />
      </div>
      {walletModal && (
        <ConnectWalletModal
          onClose={() => {
            setWalletModal(false);
          }}
        />
      )}
    </Card>
  );
};

const upcomingProposalsData = [
  {
    title: "Should we increase the regular monthly NONAME burn?",
    datePosted: "Posted December 16th 2022",
    status: "Coming soon",
    votes: 0,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    datePosted: "Posted December 16th 2022",
    status: "Coming soon",
    votes: 0,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    datePosted: "Posted December 16th 2022",
    status: "Coming soon",
    votes: 0,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    datePosted: "Posted December 16th 2022",
    status: "Coming soon",
    votes: 0,
  },
  {
    title: "Should we increase the regular monthly NONAME burn?",
    datePosted: "Posted December 16th 2022",
    status: "Coming soon",
    votes: 0,
  },
];

const totalVotesData = [
  { proposal: "Voting topic", totalVotes: 100, fillWidth: "90%" },
  { proposal: "Voting topic", totalVotes: 10, fillWidth: "90%" },
  { proposal: "Voting topic", totalVotes: 100, fillWidth: "75%" },
  { proposal: "Voting topic", totalVotes: 54, fillWidth: "40%" },
  { proposal: "Voting topic", totalVotes: 100, fillWidth: "20%" },
  { proposal: "Voting topic", totalVotes: 234, fillWidth: "10%" },
  { proposal: "Voting topic", totalVotes: 66, fillWidth: "20%" },
  { proposal: "Voting topic", totalVotes: 3, fillWidth: "10%" },
];

const Vote = () => {
  const [searchValue, setSearchValue] = useState("");
  const [upcomingPage, setUpcomingPage] = useState(1);

  return (
    <PageWrapper>
      <DataWrapper>
        <Typography variant="h1">Governance</Typography>
        <PageDescription variant="p">
          The voice of the FOMO community
        </PageDescription>
        <SearchWrapper>
          <SearchInput
            type="text"
            placeholder="Search"
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle />}
            value={searchValue}
          />
        </SearchWrapper>
        <CardsWrapper>
          <DataCard>
            <div>
              <div>
                <p>Proposals</p>
                <b>5</b>
              </div>
              <SpeedIcon />
            </div>
          </DataCard>
          <DataCard>
            <div>
              <div>
                <p>Total votes</p>
                <b>5,118</b>
              </div>
              <VoteIcon />
            </div>
          </DataCard>
        </CardsWrapper>
      </DataWrapper>
      <br />
      <Typography variant="h3">
        <b>How to vote on Proposals?</b>
      </Typography>
      <Typography variant="p">
        Everyone can vote on the proposals. However, number of votes are
        allocated based on the FOMO NFT key. 1 NFT = 1 VOTE.
      </Typography>
      <br />
      <ProposalCardList />
      <br />
      <br />
      <br />
      <Table variant="default">
        <h3>Total votes</h3>
        <br />
        <br />
        <div className="table">
          <div className="header">
            <p>Proposals</p>
            <p>Total votes</p>
          </div>

          {totalVotesData.map((data, index) => (
            <div className="row" key={index}>
              <b>{data.proposal}</b>
              <div>
                {data.totalVotes} Votes
                <div className="line">
                  <div className="fill" style={{ width: data.fillWidth }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Table>
      <br />
      <br />
      <br />
      <UpcomingCard variant="default">
        <h2>Upcoming proposals</h2>
        <div className="b-line" />

        {upcomingProposalsData.map((proposal, index) => (
          <div key={index}>
            <div className="flex">
              <div>
                <p>{proposal.title}</p>
                <span>{proposal.datePosted}</span>
              </div>
              <div>
                <b>{proposal.status}</b>
                <br />
                <span className="green">VOTES: {proposal.votes}</span>
              </div>
            </div>
            <div className="line" />
          </div>
        ))}

        <div className="pagination">
          <Pagination
            page={upcomingPage}
            total={20}
            limit={100}
            totalPage={20}
            onChange={(value) => setUpcomingPage(value)}
          />
        </div>
      </UpcomingCard>
      <br />
      <br />
      <br />
      <ConcludedProposalsCard />
    </PageWrapper>
  );
};

export default Vote;
