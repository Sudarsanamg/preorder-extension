// utils/formatDate.ts

export function formatDate(input: string | Date): string {
  if (!input) return "";

  const date = input instanceof Date ? input : new Date(input);

  if (isNaN(date.getTime())) return ""; // invalid date safeguard

  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
   
}
