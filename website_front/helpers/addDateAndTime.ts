export default function addDateAndTime(dateStr: Date | null, timeStr: string) {
  if(!dateStr) return Date.now();
  
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const year = dateStr.getFullYear();
  const month = dateStr.getMonth();
  const day = dateStr.getDate();

  const timeParts = timeStr.split(":");
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);

  const newDate = new Date(year, month, day, hours, minutes).getTime();

  return newDate;
}
