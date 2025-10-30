import React from "react";
import { TableCell } from "@mui/material";

function Headers({ slotNumbers }: { slotNumbers: number[] }) {
  const headers = (
    <React.Fragment>
      <TableCell key="days-slots-header" sx={{ minWidth: 100 }}>Days/Slots</TableCell>
      {slotNumbers.map((slotNumber) => (
        <TableCell key={slotNumber} sx={{ minWidth: 100 }}>{slotNumber}</TableCell>
      ))}
    </React.Fragment>
  );
  return headers;
}

export default Headers;
