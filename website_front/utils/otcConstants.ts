import WaitingIcon from "../assets/icons/otc/waiting.svg";
import BlockedIcon from "../assets/icons/otc/blocked.svg";
import StartedIcon from "../assets/icons/otc/started.svg";
import EndedIcon from "../assets/icons/otc/complete.svg";

export const statuses = {
  waiting: "Available",
  started: "Started",
  ended: "Ended",
  blocked: "Wait for confirm",
  "forced-termination": "Closed",
  appeal: "Appeal Submitted",
};

export const statusesReverse = {
  Available: "waiting",
  Started: "started",
  Ended: "ended",
  "Wait for confirm": "blocked",
  "Funds reserved": "started",
  Closed: "forced-termination",
  "Appeal Submitted": "appeal",
};

export const StatusesIcons = {
  waiting: WaitingIcon,
  started: StartedIcon,
  ended: EndedIcon,
  blocked: BlockedIcon,
  "forced-termination": BlockedIcon,
  appeal: BlockedIcon,
};

export const StatusesDescription = {
  waiting: "The deal is currently available for users",
  started: "The deal has started. Wait for funds to be reserved by the seller",
  reserved:
    "The deal has started. The seller has reserved funds, the seller must transfer the assets to the buyer",
  ended: "The deal has ended successfully",
  blocked: "The deal is blocked for confirmation",
  "forced-termination": "The deal was terminated",
  review:
    "As long as users does not leave feedback, the project does not change its status to completed",
  appeal:
    "An appeal has been submitted for this deal. Support team is investigating the issue",
};
