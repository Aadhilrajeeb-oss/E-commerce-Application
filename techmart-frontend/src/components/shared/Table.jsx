import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Table = ({ columns, data, pagination, onPageChange, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950/50 border-b border-gray-800">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-gray-800/30 transition-colors duration-150">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-950/30">
          <span className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-300">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-gray-300">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-300">{pagination.total}</span> results
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
