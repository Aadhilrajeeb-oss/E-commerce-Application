/**
 * Convert an array of objects to a downloadable CSV string.
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Keys to include (in order)
 * @param {string[]} headers - Header labels (matching columns order)
 * @returns {string} CSV content
 */
export const toCSV = (data, columns, headers) => {
  const headerRow = headers.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col] ?? '';
      // Wrap in quotes if the value contains commas or quotes
      return typeof val === 'string' && (val.includes(',') || val.includes('"'))
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  return [headerRow, ...rows].join('\n');
};

/**
 * Trigger a CSV file download in the browser.
 * @param {string} csvContent
 * @param {string} filename
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
