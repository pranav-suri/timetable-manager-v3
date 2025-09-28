import React from "react";
import { TableCell } from "@mui/material";

function Headers({ slotNumbers }: { slotNumbers: number[] }) {
  const headers = (
    <React.Fragment>
      <TableCell key="days-slots-header">Days/Slots</TableCell>
      {slotNumbers.map((slotNumber) => (
        <TableCell key={slotNumber}>{slotNumber}</TableCell>
      ))}
    </React.Fragment>
  );
  return headers;
}

export default Headers;
