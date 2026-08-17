import { createUseStyles } from "react-jss";
import { STATUS_LIST } from "../../../../../../types/global_types";

interface Props {
  status: string;
  rating?: number;
  projectStatus: STATUS_LIST;
}

const getStatusColor = (status: STATUS_LIST) => {
  switch (status) {
    case STATUS_LIST.ACTIVE:
      return "var(--color-primary)";
    case STATUS_LIST.UPCOMING:
      return "#E9B500";
    case STATUS_LIST.ENDED:
      return "var(--color-danger)";
    case STATUS_LIST.NEW:
      return "var(--color-primary)";
    case STATUS_LIST.BLOCKED:
      return "var(--color-danger)";
    default:
      return "var(--color-primary)";
  }
};

const getStatusColorBackground = (status: STATUS_LIST) => {
  switch (status) {
    case STATUS_LIST.ACTIVE:
      return "rgba(0, 192, 153, 0.1)";
    case STATUS_LIST.UPCOMING:
      return "rgba(233, 181, 0, 0.1)";
    case STATUS_LIST.ENDED:
      return "rgba(255, 88, 88, 0.1)";
    case STATUS_LIST.NEW:
      return "rgba(0, 192, 153, 0.1)";
    case STATUS_LIST.BLOCKED:
      return "rgba(255, 88, 88, 0.1)";
    default:
      return "rgba(0, 192, 153, 0.1)";
  }
};

export const useStyles = createUseStyles({
  wrapper: {
    background: ({ status }: Props) =>
      status ? "rgba(255, 88, 88, 0.05)" : "white",
  },
  rowWrapper: {
    display: "flex",
    alignItems: "center",
    padding: "16px 23px",
    borderBottom: "1px solid #eee",
  },
  projectWrapper: {
    position: "relative",
    width: 220,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  projectImage: {
    width: 32,
  },
  projectDataWrapper: {
    display: "flex",
  },
  projectTitle: {
    display: "flex",
    alignItems: "center",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "14px",
    lineHeight: "17px",
    gap: 6,

    "& span": {
      color: "var(--color-primary)",
    },
  },
  projectDescription: {
    fontWeight: "var(--font-weight-regular)",
    fontSize: "14px",
    lineHeight: "17px",
    color: "var(--color-text-muted)",
  },
  statusWrapper: {
    width: 110,

    "& span": {
      color: ({ projectStatus }: Props) => getStatusColor(projectStatus),
      padding: "4px 14px 4px 6px",
      background: ({ projectStatus }: Props) =>
        getStatusColorBackground(projectStatus),
      borderRadius: 8,
    },
  },
  validationCell: {
    width: 100,
    marginRight: "20px",
    gap: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 6px 4px 6px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "14px",
    "&.moderator": {
      color: "rgb(233, 181, 0)",
      background: "rgba(233, 181, 0, 0.1)",
    },
    "&.active": {
      color: "rgb(0, 192, 153)",
      background: "rgba(0, 192, 153, 0.1)",
    },
    "&.admin": {
      color: "white",
      background: "#6bb1fc",
    },
  },
  investorsWrapper: {
    width: 200,
  },
  raisedWrapper: {
    width: 92,
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "14px",
    lineHeight: "17px",
  },
  fundingWrapper: {
    width: 110,
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "14px",
    lineHeight: "17px",
  },
  typeWrapper: {
    width: 81,
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "14px",
    lineHeight: "17px",
  },
  tagCircle: {
    width: 16,
    height: 16,
    background: "rgba(115, 128, 148, 0.5)",
    borderRadius: "100%",
  },
  tagWrapper: {
    width: 164,
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: "12px",
    lineHeight: "14px",
    color: "var(--color-text-muted)",
  },
  flagsWrapper: {
    width: 68,
  },
  ratingWrapper: {
    width: 118,
  },
  actionsWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  dotsAction: {
    "& svg circle": {
      fill: "rgba(115, 128, 148, 0.5)",
    },
  },
  projectDuplicate: {
    fontSize: "12px",
    color: "white",
    background: "#808080c6",
    padding: "4px",
    borderRadius: "4px",
  },
});
