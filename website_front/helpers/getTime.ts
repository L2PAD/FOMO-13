export const getDateWithTime = (event: any): Date => {
  const eventDate = new Date(event.date);
  const [hours, minutes] = event.time.split(":");
  eventDate.setHours(hours);
  eventDate.setMinutes(minutes);

  return eventDate;
};
