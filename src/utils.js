/**
 * Utility functions for the graph visualizations
 */

/**
 * Gets the specified number of trailing weeks from a dataset
 * @param {Array} data - Full dataset
 * @param {number} numWeeks - Number of weeks to return
 * @returns {Array} Filtered dataset with only the specified number of trailing weeks
 */
export function getTrailingWeeks(data, numWeeks) {
  if (!data || data.length === 0) return [];
  return data.slice(-numWeeks);
}

/**
 * Formats a date according to the specified format
 * @param {Date} date - Date to format
 * @param {string} format - Optional format string (defaults to MM/DD/YYYY)
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'MM/DD/YYYY') {
  if (!date) return '';
  
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format.toUpperCase()) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MMM DD':
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[d.getMonth()]} ${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
}

/**
 * Gets the start of the week for a given date
 * @param {Date} date - Input date
 * @returns {Date} Date object set to the start of the week
 */
export function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Set to Sunday
  return d;
}

/**
 * Gets the start of the month for a given date
 * @param {Date} date - Input date
 * @returns {Date} Date object set to the start of the month
 */
export function getMonthStart(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Checks if two dates are in the same week
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are in the same week
 */
export function isSameWeek(date1, date2) {
  const week1 = getWeekStart(date1);
  const week2 = getWeekStart(date2);
  return week1.getTime() === week2.getTime();
}

/**
 * Checks if two dates are in the same month
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are in the same month
 */
export function isSameMonth(date1, date2) {
  return date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
} 