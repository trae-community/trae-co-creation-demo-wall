export type SortableFilterOption = {
  label: string;
  value: string;
  sortOrder?: number | null;
  parentValue?: string | null;
};

export function sortFilterOptions<T extends SortableFilterOption>(items: T[], lang: string) {
  return [...items].sort((a, b) => {
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.label.localeCompare(b.label, lang);
  });
}
