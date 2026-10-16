import { useState } from 'react';

export const usePagination = <T>(items: T[], pageSize: number) => {
  const [requestedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Clamp so a shrinking list (filters, deletes) never strands us on an empty page
  const page = Math.min(requestedPage, totalPages);
  return {
    page,
    setPage,
    totalPages,
    pageSize,
    total: items.length,
    pageItems: items.slice((page - 1) * pageSize, page * pageSize),
  };
};
