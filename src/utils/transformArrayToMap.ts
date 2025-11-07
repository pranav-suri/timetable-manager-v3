/**
 * @example
 * const array = [
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 3, name: 'Charlie' },
 * ];
 *
 * const map = transformArrayToMap(array, (item) => item.id);
 *
 * Output:
 * {
 *   1: { id: 1, name: 'Alice' },
 *   2: { id: 2, name: 'Bob' },
 *   3: { id: 3, name: 'Charlie' },
 * }
 */
 
export function transformArrayToMap<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      acc[key] = item;
      return acc;
    },
    {} as Record<K, T>,
  );
}
