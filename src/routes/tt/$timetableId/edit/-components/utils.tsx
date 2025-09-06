import { Typography } from "@mui/material";

export const getInitials = (name: string) => {
  // get all initials (eg: Dr. Nilima Zade = DNZ)
  const initials = name.match(/\b\w/g) || [];
  return initials.map((initial) => initial.toUpperCase()).join("");
};

export function formatNames(
  items: Array<{
    id: string;
    name: string;
  }>,
) {
  return items.map((item, index) => (
    <Typography key={item.id}>
      {" "}
      {item.name}
      {index !== items.length - 1 && ","}
    </Typography>
  ));
}
