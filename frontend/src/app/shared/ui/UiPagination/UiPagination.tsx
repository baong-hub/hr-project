import styles from './UiPagination.module.scss';

interface UiPaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const UiPagination = ({
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: UiPaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);

  const getPageNumbers = (current: number, total: number): (number | '...')[] => {
    if (total <= 10) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    pages.add(current);
    if (current - 1 >= 1) pages.add(current - 1);
    if (current + 1 <= total) pages.add(current + 1);

    const sorted = [...pages].sort((a, b) => a - b);
    const result: (number | '...')[] = [];

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        if (sorted[i] - sorted[i - 1] === 2) {
          result.push(sorted[i - 1] + 1); // fill single gap
        } else {
          result.push('...');
        }
      }
      result.push(sorted[i]);
    }

    return result;
  };

  if (total === 0) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, total);

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.leftSide}>
        <span className={styles.text}>Xem</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
          }}
          className={styles.pageSizeSelect}
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        <span className={styles.text}>/ {total} bản ghi</span>
        <span className={styles.rangeText}>Hiển thị {startRange}-{endRange}</span>
      </div>
      <div className={styles.rightSide}>
        <button
          className={styles.navButton}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &lsaquo;
        </button>
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${page}`}
              className={`${styles.pageButton} ${
                page === currentPage ? styles.active : ''
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          );
        })}
        <button
          className={styles.navButton}
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
};
