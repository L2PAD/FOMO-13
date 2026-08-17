import React, { useEffect } from "react";
import {
  NotificationsOverlay,
  NotificationsPanel,
  NotificationsHeader,
  NotificationsTitle,
  MarkAllReadButton,
  NotificationsList,
  NotificationItem,
  NotificationIcon,
  NotificationContent,
  NotificationTitle,
  NotificationDescription,
  NotificationMeta,
  NotificationStatus,
  NotificationTime,
  NotificationActions,
  ActionButton,
  ViewDetailsButton,
  DeclineButton,
  CloseNotificationButton,
  ClearAllButton,
  UnreadDot,
  NotificationStats,
  StatItem,
} from "./NotificationsPanel.styles";
import { X, Check } from "lucide-react";
import SwordsIcon from "../../../global/Icons/Swords";
import ArenaTabIcon from "../../../global/Icons/ArenaTabIcon";
import { DuelChallengeModal } from "../duel-challenge-modal/DuelChallengeModal";
import { PredictionDetailsModal } from "../prediction-details-modal/PredictionDetailsModal";
import mock1 from "../../../../assets/images/nft/shark.png";

interface Notification {
  id: number;
  type: "duel_request" | "prediction_lost" | "prediction_won";
  title: string;
  description: string | React.ReactNode;
  status: string;
  time: string;
  isUnread: boolean;
  stats?: {
    loss?: string;
    payout?: string;
    xp: string;
  };
  details?: string;
  challenge?: {
    challengerName: string;
    challengerAvatar: string;
    market: string;
    challengerSide: "yes" | "no";
    yourSide: "yes" | "no";
    stake: number;
    expiresIn: string;
  };
  predictionDetails?: {
    title: string;
    betId: string;
    placedDate: string;
    status: "won" | "lost";
    position: string;
    side: "yes" | "no";
    stakeAmount: number;
    odds: string;
    profit?: number;
    loss?: number;
    payout?: number;
    xpEarned: string;
    totalVolume: string;
    yourShare: string;
    yesVotes?: string;
    noVotes?: string;
    positions?: Array<{
      amount: string;
      side: "yes" | "no";
      percentage: string;
    }>;
    marketResolvedDate: string;
    resolutionText: string;
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "duel_request",
    title: "New duel request",
    description: (
      <>
        <strong>Lucas Williams</strong> challenged you to a 1,000 USDT duel on
        "ETH above 3,000 at the end of Jan 2026".
      </>
    ),
    status: "Pending",
    time: "23 minutes ago",
    isUnread: true,
    challenge: {
      challengerName: "Jackson Adams",
      challengerAvatar: mock1.src,
      market: "ETH above $3,000 in 2025",
      challengerSide: "yes",
      yourSide: "no",
      stake: 100,
      expiresIn: "24 hours",
    },
  },
  {
    id: 2,
    type: "prediction_lost",
    title: "Prediction lost",
    description: (
      <>
        Your prediction on <strong>"Fed raises rates in March"</strong> was
        incorrect.
      </>
    ),
    status: "Lost",
    time: "25 minutes ago",
    isUnread: true,
    stats: {
      loss: "-75 USDT",
      xp: "+1",
    },
    details: "Refine your thesis and take another shot on FOMO Arena.",
    predictionDetails: {
      title: "Fed raises rates in March",
      betId: "#202",
      placedDate: "March 5, 2026 • 00:00",
      status: "lost",
      position: "",
      side: "yes",
      stakeAmount: 100,
      odds: "1.8x",
      loss: -100,
      xpEarned: "+1 XP",
      totalVolume: "8,900 USDT",
      yourShare: "1.8%",
      yesVotes: "45%",
      noVotes: "55%",
      marketResolvedDate: "March 20, 2026 • 00:00",
      resolutionText:
        "Fed decided to keep rates unchanged at the March meeting",
    },
  },
  {
    id: 3,
    type: "prediction_won",
    title: "Prediction won",
    description: (
      <>
        Your prediction on <strong>"BTC reaches $120K in Q2 2026"</strong> was
        correct!
      </>
    ),
    status: "Won",
    time: "25 minutes ago",
    isUnread: false,
    stats: {
      payout: "+250 USDT",
      xp: "+10",
    },
    predictionDetails: {
      title: "Ethereum above __ at the end of 2025?",
      betId: "#202",
      placedDate: "March 5, 2026 • 00:00",
      status: "won",
      position: "2,500",
      side: "yes",
      stakeAmount: 100,
      odds: "2.5x",
      profit: 150,
      payout: 250,
      xpEarned: "+10 XP",
      totalVolume: "12,450 USDT",
      yourShare: "2.4%",
      positions: [
        { amount: "2,500", side: "yes", percentage: "45%" },
        { amount: "2,500", side: "no", percentage: "5%" },
        { amount: "3,000", side: "yes", percentage: "5%" },
        { amount: "3,000", side: "no", percentage: "45%" },
      ],
      marketResolvedDate: "March 20, 2026 • 00:00",
      resolutionText: "ETH reached $2,800 on December 31, 2026",
    },
  },
];

export const NotificationsPanelComponent: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = React.useState(false);
  const [selectedChallenge, setSelectedChallenge] = React.useState<
    Notification["challenge"] | null
  >(null);
  const [isPredictionModalOpen, setIsPredictionModalOpen] =
    React.useState(false);
  const [selectedPrediction, setSelectedPrediction] = React.useState<
    Notification["predictionDetails"] | null
  >(null);

  const markAsRead = React.useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  }, []);

  const handleViewChallengeDetails = (challenge: Notification["challenge"]) => {
    if (challenge) {
      setSelectedChallenge(challenge);
      setIsChallengeModalOpen(true);
    }
  };

  const handleViewPredictionDetails = (
    predictionDetails: Notification["predictionDetails"]
  ) => {
    if (predictionDetails) {
      setSelectedPrediction(predictionDetails);
      setIsPredictionModalOpen(true);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "duel_request":
        return (
          <NotificationIcon $variant="info">
            <SwordsIcon size={20} color="#0ea5e9" />
          </NotificationIcon>
        );
      case "prediction_lost":
        return (
          <NotificationIcon $variant="danger">
            <X size={20} />
          </NotificationIcon>
        );
      case "prediction_won":
        return (
          <NotificationIcon $variant="success">
            <Check size={20} />
          </NotificationIcon>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("#notifications-panel") === null &&
        target.closest("#notifications-button") === null
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Mobile: mark notifications as read when they scroll into view
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth <= 640;
    if (!isMobile) return;

    const items = document.querySelectorAll("[data-notification-id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(
              entry.target.getAttribute("data-notification-id")
            );
            markAsRead(id);
          }
        });
      },
      { threshold: 0.6 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [isOpen, markAsRead]);


  return (
    <>
      {isOpen && (
        <>
          <NotificationsOverlay onClick={onClose} />
          <NotificationsPanel id="notifications-panel">
            <NotificationsHeader>
              <NotificationsTitle>Notifications</NotificationsTitle>
              <MarkAllReadButton>Mark all read</MarkAllReadButton>
            </NotificationsHeader>

            <NotificationsList>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  $isUnread={notification.isUnread}
                  data-notification-id={notification.id}
                  onMouseEnter={() =>
                    notification.isUnread && markAsRead(notification.id)
                  }
                >
                  <CloseNotificationButton>
                    <X size={20} color="#738094" />
                  </CloseNotificationButton>

                  {getNotificationIcon(notification.type)}

                  <NotificationContent>
                    <NotificationTitle>{notification.title}</NotificationTitle>
                    <NotificationDescription>
                      {notification.description}
                    </NotificationDescription>

                    {notification.stats && (
                      <NotificationStats>
                        {notification.stats.loss && (
                          <StatItem $variant="danger">
                            Loss: <strong>{notification.stats.loss}</strong>
                          </StatItem>
                        )}
                        {notification.stats.payout && (
                          <StatItem $variant="success">
                            Payout: <strong>{notification.stats.payout}</strong>
                          </StatItem>
                        )}
                        <StatItem $variant="success">
                          XP earned: <strong>{notification.stats.xp}</strong>
                        </StatItem>
                      </NotificationStats>
                    )}

                    {notification.details && (
                      <NotificationDescription style={{ marginTop: "8px" }}>
                        {notification.details}
                      </NotificationDescription>
                    )}

                    <NotificationMeta>
                      <NotificationStatus
                        $variant={notification.status.toLowerCase()}
                      >
                        {notification.status}
                      </NotificationStatus>
                      <NotificationTime>{notification.time}</NotificationTime>
                    </NotificationMeta>

                    <NotificationActions>
                      {notification.type === "duel_request" ? (
                        <>
                          <ActionButton>
                            <Check size={12} />
                            Accept
                          </ActionButton>
                          <ActionButton className="decline">
                            <X size={12} />
                            Decline
                          </ActionButton>
                          <ViewDetailsButton
                            onClick={() => {
                              onClose();
                              handleViewChallengeDetails(
                                notification.challenge
                              );
                            }}
                          >
                            View details
                          </ViewDetailsButton>
                        </>
                      ) : (
                        <>
                          <ActionButton>
                            <ArenaTabIcon color="#ffffff" />
                            Try again
                          </ActionButton>
                          <ViewDetailsButton
                            onClick={() => {
                              onClose();
                              handleViewPredictionDetails(
                                notification.predictionDetails
                              );
                            }}
                          >
                            View details
                          </ViewDetailsButton>
                        </>
                      )}
                    </NotificationActions>
                  </NotificationContent>
                </NotificationItem>
              ))}
            </NotificationsList>

            <ClearAllButton>Clear all notifications</ClearAllButton>
          </NotificationsPanel>
        </>
      )}

      {selectedChallenge && (
        <DuelChallengeModal
          isOpen={isChallengeModalOpen}
          onClose={() => {
            setIsChallengeModalOpen(false);
            setSelectedChallenge(null);
          }}
          challenge={selectedChallenge}
        />
      )}

      {selectedPrediction && (
        <PredictionDetailsModal
          isOpen={isPredictionModalOpen}
          onClose={() => {
            setIsPredictionModalOpen(false);
            setSelectedPrediction(null);
          }}
          prediction={selectedPrediction}
        />
      )}
    </>
  );
};
