import React, { useState } from "react";
import ConnectDiscordModal from "../modals/ConnectDiscordModal";
import { Button, Description, PageWrapper, Title } from "./styles";

const JoinWrapper = () => {
  const [discordModal, setDiscordModal] = useState(false);
  return (
    <PageWrapper>
      <Title variant="p">Join the community</Title>
      <Description variant="p">
        Learn from others, share your work, and extend your tool set with a
        diverse group of web3 founders, community managers, growth hackers,
        marketers, content writers, and many more from around the world.
      </Description>
      <Button onClick={() => setDiscordModal(true)}>join our Discord</Button>
      {discordModal && (
        <ConnectDiscordModal onClose={() => setDiscordModal(false)} />
      )}
    </PageWrapper>
  );
};

export default JoinWrapper;
