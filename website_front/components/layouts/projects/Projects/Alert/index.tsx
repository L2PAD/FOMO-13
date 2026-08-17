import Typography from "../../../../global/common/Typography";
import { Colored } from "../Project/styles";
import { Close, Container, Link } from "./styles";

interface Props {
  onClose: () => void;
}

const Alert = ({ onClose }: Props) => {
  return (
    <Container>
      <Close onClick={onClose}>✖</Close>
      <Typography variant="h2">Nft set on sell</Typography>
      <Colored variant="gray">Price: 166546</Colored>
      <Link>View on explorer</Link>
    </Container>
  );
};

export default Alert;
