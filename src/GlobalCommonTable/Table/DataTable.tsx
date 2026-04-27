import React from 'react';
import { ColumnSetting } from './TableTypes';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnSetting[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (key: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, val: string) => void;
  renderCell: (item: T, column: ColumnSetting) => React.ReactNode;
  viewportHeight: number;
  showActionColumn?: boolean;
  onEditClick?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
  sortKey,
  sortDirection,
  onSort,
  filters,
  onFilterChange,
  renderCell,
  viewportHeight,
  showActionColumn = true,
  onEditClick
}: DataTableProps<T>) {
  return (
    <div className="border border-[#DDDDDD] overflow-hidden">
      <div
        style={{
          maxHeight: `${viewportHeight}px`,
          overflow: 'auto',
          position: 'relative',
          backgroundColor: '#fff'
        }}
      >
        <table
          className="w-full text-left border-collapse align-middle mb-0"
          style={{
            width: 'max-content',
            minWidth: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: 0
          }}
        >
          <thead 
            className="sticky top-0 bg-white"
            style={{ 
              zIndex: 20,
              boxShadow: '0 1px 0 rgba(0,0,0,0.05)'
            }}
          >
            <tr>
              {/* Checkbox column */}
              <th 
                style={{ width: '40px' }} 
                className="text-center align-middle bg-white border-b border-[#DDDDDD]"
              >
                <input 
                  type="checkbox" 
                  checked={isAllSelected} 
                  onChange={onToggleSelectAll} 
                />
              </th>

              {columns.map(col => (
                <th 
                  key={col.id} 
                  style={{ width: `${col.width}px` }} 
                  className="bg-white border-b border-[#DDDDDD] px-1 py-1 align-middle font-normal"
                >
                  {/* Input Group */}
                  <div className="flex items-center border border-[#BDBDBD] bg-white h-[32px] overflow-hidden font-normal">
                    
                    {/* Input */}
                    <input 
                      type="search" 
                      placeholder={col.label}
                      value={filters[col.key] || ''}
                      onChange={(e) => onFilterChange(col.key, e.target.value)}
                      autoComplete="off"
                      className="flex-1 w-full h-full px-2 text-sm font-normal outline-none bg-transparent placeholder-[#918D8D] border-0 focus:ring-0"
                    />

                    {/* Sort Arrows */}
                    <div 
                      className="flex flex-col justify-center items-center px-2 cursor-pointer text-[#918D8D] border-l-0"
                      onClick={() => onSort(col.key)}
                    >
                      <i 
                        className={`bi bi-chevron-up text-[10px] leading-[0.6] ${
                          sortKey === col.key && sortDirection === 'asc' 
                            ? 'text-[#2F5596]' 
                            : ''
                        }`}
                      ></i>
                      <i 
                        className={`bi bi-chevron-down text-[10px] leading-[0.6] mt-[1px] ${
                          sortKey === col.key && sortDirection === 'desc' 
                            ? 'text-[#2F5596]' 
                            : ''
                        }`}
                      ></i>
                    </div>

                  </div>
                </th>
              ))}

              {showActionColumn && (
                <th 
                  style={{ width: '50px' }} 
                  className="bg-white border-b border-[#DDDDDD]"
                />
              )}
            </tr>
          </thead>

          <tbody>
            {data.map(item => (
              <tr
                key={item.id}
                className={selectedIds.has(item.id) ? 'bg-[#FEF1B6]' : 'hover:bg-[#F0F0F0]'}
              >
                <td className="text-center border-b border-[#DDDDDD] py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                  />
                </td>

                {columns.map(col => (
                  <td key={col.id} className="truncate border-b border-[#DDDDDD] px-2 py-2">
                    {renderCell(item, col)}
                  </td>
                ))}

                {showActionColumn && (
                  <td className="text-center border-b border-[#DDDDDD] py-2">
                    <button
                      className="inline-flex items-center justify-center p-1 text-[#2F5596] hover:opacity-80 bg-transparent border-0 cursor-pointer"
                      onClick={() => onEditClick?.(item)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 2048 2048">
                        <path fill="#2F5596" d="M2048 128v640h-128V640H128v1024h640v128H0V128h2048zm-128 128H128v256h1792V256zm-72 640q42 0 78 15t64 42t42 63t16 78q0 39-15 76t-43 65l-717 719l-377 94l94-377l717-718q28-28 65-42t76-15zm51 249q21-21 21-51q0-31-20-50t-52-20q-14 0-27 4t-23 15l-692 694l-34 135l135-34l692-693z"/>
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (showActionColumn ? 2 : 1)} className="text-center py-8 text-[#918D8D]">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}