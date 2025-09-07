function formatFirebaseTime(value) {
  if (!value) return "無";
  let date = new Date(value);
  if (
    date.toLocaleString() === "Invalid Date" &&
    (value.seconds || value["_seconds"])
  )
    date = new Date(Number(value.seconds || value["_seconds"]) * 1000);

  if (date.toLocaleString() === "Invalid Date") return "無";

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export { formatFirebaseTime };
