
export const formatOnlineStatus = (onlineDate?: Date | string): string => {
  if (!onlineDate) return "offline";

  const now = new Date();
  const lastOnline = new Date(onlineDate);
  const diffInMs = now.getTime() - lastOnline.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) {
    return "online";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };
  return lastOnline.toLocaleDateString('en-US', options);
};
