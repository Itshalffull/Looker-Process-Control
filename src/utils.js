/**
 * Utility functions for the graph visualizations
 */

/**
 * Gets the specified number of trailing weeks from a dataset
 * @param {Array} data - Full dataset
 * @param {number} numWeeks - Number of weeks to return
 * @returns {Array} Filtered dataset with only the specified number of trailing weeks
 * @throws {Error} If input data is invalid
 */
export function getTrailingWeeks(data, numWeeks) {
  if (!Array.isArray(data)) {
    throw new Error('Input data must be an array');
  }
  if (typeof numWeeks !== 'number' || numWeeks < 1) {
    throw new Error('Number of weeks must be a positive number');
  }
  if (data.length === 0) return [];
  
  return data.slice(-Math.min(numWeeks, data.length));
}

/**
 * Formats a date according to the specified format
 * @param {Date|string} date - Date to format
 * @param {string} format - Optional format string (defaults to MM/DD/YYYY)
 * @returns {string} Formatted date string
 * @throws {Error} If date is invalid
 */
export function formatDate(date, format = 'MM/DD/YYYY') {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    
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
      case 'LOOKER_STUDIO_DATE':
        // Format specifically for Looker Studio's date format
        return `${year}${month}${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Gets the start of the week for a given date
 * @param {Date|string} date - Input date
 * @returns {Date} Date object set to the start of the week
 * @throws {Error} If date is invalid
 */
export function getWeekStart(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Set to Sunday
    return d;
  } catch (error) {
    console.error('Error getting week start:', error);
    throw error;
  }
}

/**
 * Gets the start of the month for a given date
 * @param {Date|string} date - Input date
 * @returns {Date} Date object set to the start of the month
 * @throws {Error} If date is invalid
 */
export function getMonthStart(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  } catch (error) {
    console.error('Error getting month start:', error);
    throw error;
  }
}

/**
 * Checks if two dates are in the same week
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if dates are in the same week
 * @throws {Error} If either date is invalid
 */
export function isSameWeek(date1, date2) {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      throw new Error('Invalid date(s)');
    }
    
    const week1 = getWeekStart(d1);
    const week2 = getWeekStart(d2);
    return week1.getTime() === week2.getTime();
  } catch (error) {
    console.error('Error comparing weeks:', error);
    return false;
  }
}

/**
 * Checks if two dates are in the same month
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if dates are in the same month
 * @throws {Error} If either date is invalid
 */
export function isSameMonth(date1, date2) {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      throw new Error('Invalid date(s)');
    }
    
    return d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  } catch (error) {
    console.error('Error comparing months:', error);
    return false;
  }
} 