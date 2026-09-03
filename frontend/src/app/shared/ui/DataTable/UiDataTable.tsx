import React from 'react';
import styles from './UiDataTable.module.scss';

export interface ColumnConfig<T> {
  key: string;
  header: React.ReactNode;
  width?: string | number;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

interface UiDataTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function UiDataTable<T extends { id: any }>({ 
  columns, 
  data, 
  loading, 
  emptyText = 'Không có dữ liệu',
  className = ''
}: UiDataTableProps<T>) {
  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                  className={col.sticky ? styles.stickyCol : ''}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  {columns.map(col => (
                    <td key={col.key} className={col.sticky ? styles.stickyCol : ''}>
                      <div className={styles.skeletonItem} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id}>
                  {columns.map(col => (
                    <td 
                      key={col.key} 
                      style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                      className={col.sticky ? styles.stickyCol : ''}
                    >
                      {col.render ? col.render(row, index) : (row as any)[col.key] || '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
