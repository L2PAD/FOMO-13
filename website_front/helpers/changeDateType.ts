export default (date: any, type?: number): any => {
  const dateInitial: Date = date ? new Date(date) : new Date();

  if (type === 1) {
    return String(
      `${dateInitial.getDate()}.${dateInitial.getMonth()}.${dateInitial.getFullYear()} ${dateInitial.getHours()}:${dateInitial.getMinutes() < 10}`
    );
  }

  if (type === 2) {
    const day = String(dateInitial).split(" ")[0];
    return String(
      `${dateInitial.toDateString().split(" ")[1]} ${day}, ${dateInitial.getFullYear()}`
    );
  }

  if (type === 3) {
    const day = String(dateInitial).split(" ")[0];
    return String(
      `${day} ${dateInitial.toDateString().split(" ")[1]}, ${dateInitial.getFullYear()}`
    );
  }

  if (type === 4) {
    const year = new Date().getFullYear();

    const currentDate = new Date(
      `${date.split(".")[1]}.${date.split(".")[0]}.${year}`
    );

    const day = String(currentDate.getDay());

    const time = String(currentDate).split(" ")[4];

    return String(
      `${currentDate.toDateString().split(" ")[1]} ${day}, ${currentDate.getFullYear()}, ${time}`
    );
  }

  if (type === 5) {
    const year = new Date().getFullYear();

    const currentDate = new Date(
      `${date.split(".")[1]}.${date.split(".")[0]}.${year}`
    );

    const month = String(currentDate).split(" ")[1];
    const day = currentDate.getDay();

    return `${month} ${day > 10 ? day : `0${day}`}, ${year}`;
  }

  if (type === 6) {
    const months = [
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
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const dayOfMonth = dateInitial.getDate();
    const monthIndex = dateInitial.getMonth();
    const month = months[monthIndex];

    let dayFormatted;
    if (dayOfMonth % 10 === 1 && dayOfMonth !== 11) {
      dayFormatted = dayOfMonth + "st";
    } else if (dayOfMonth % 10 === 2 && dayOfMonth !== 12) {
      dayFormatted = dayOfMonth + "nd";
    } else if (dayOfMonth % 10 === 3 && dayOfMonth !== 13) {
      dayFormatted = dayOfMonth + "rd";
    } else {
      dayFormatted = dayOfMonth + "th";
    }

    const formattedDate = `${dayFormatted} ${month}`;

    return formattedDate;
  }

  if (type === 7) {
    const year = dateInitial.getFullYear();
    const month = dateInitial.getMonth() + 1;
    const day = dateInitial.getDate();

    return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  }

  return String(
    `${dateInitial.toDateString().split(" ")[1]} ${dateInitial.getDate()}, ${dateInitial.getFullYear()}, ${dateInitial.getHours() > 12 ? dateInitial.getHours() - 12 : dateInitial.getHours()}:${dateInitial.getMinutes() < 10 ? `0${dateInitial.getMinutes()}` : dateInitial.getMinutes()} ${dateInitial.getHours() >= 12 ? "PM" : "AM"}`
  );
};
