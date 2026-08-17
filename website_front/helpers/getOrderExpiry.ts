export const getOrderExpiryMessage = (expiryDate: Date): string => {
  const now = new Date();

  if (expiryDate < now) {
    return "Ended";
  }

  const diffInMs = expiryDate.getTime() - now.getTime();

  const diffInSec = Math.floor(diffInMs / 1000);

  const days = Math.floor(diffInSec / (24 * 60 * 60));
  const hours = Math.floor((diffInSec % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((diffInSec % (60 * 60)) / 60);
  const seconds = diffInSec % 60;

  let expiryMessage = "Expiry: in ";
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d${days > 1 ? "" : ""}`);
  }
  if (hours > 0) {
    parts.push(`${hours}h${hours > 1 ? "" : ""}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m${minutes > 1 ? "" : ""}`);
  }

  expiryMessage += parts.join(", ");
  return expiryMessage;
};
