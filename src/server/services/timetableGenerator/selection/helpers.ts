export interface SelectionStats {
  uniqueParentsSelected: number; // Number of unique individuals selected
  mostSelectedIndex: number; // Index of most frequently selected individual
  mostSelectedCount: number; // Number of times most selected individual was chosen
  selectionDiversity: number; // Ratio of unique selections to total selections (0-1)
}

/**
 * Calculate selection statistics for monitoring diversity.
 */
export function calculateSelectionStats(
  selectedIndices: number[],
  populationSize: number,
): SelectionStats {
  if (selectedIndices.length === 0) {
    throw new Error("Cannot calculate stats for empty selection");
  }

  // Count frequency of each selection
  const selectionCounts = new Map<number, number>();

  for (const index of selectedIndices) {
    const count = selectionCounts.get(index) || 0;
    selectionCounts.set(index, count + 1);
  }

  // Find most selected individual
  let mostSelectedIndex = selectedIndices[0]!;
  let mostSelectedCount = selectionCounts.get(mostSelectedIndex) || 0;

  for (const [index, count] of selectionCounts) {
    if (count > mostSelectedCount) {
      mostSelectedIndex = index;
      mostSelectedCount = count;
    }
  }

  const uniqueParentsSelected = selectionCounts.size;
  const selectionDiversity = uniqueParentsSelected / populationSize;

  return {
    uniqueParentsSelected,
    mostSelectedIndex,
    mostSelectedCount,
    selectionDiversity,
  };
}
