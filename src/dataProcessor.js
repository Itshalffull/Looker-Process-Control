/**
 * Functions for processing and transforming data for the graph visualizations
 */

/**
 * Parses raw Looker Studio data into a standardized format
 * @param {Object} data - Raw data from Looker Studio
 * @returns {Array} Parsed data array
 * @throws {Error} If required fields are missing
 */
export function parseData(data) {
  try {
    const { tables, fields } = data;
    
    // Access the first dimension and metrics
    const dateDimensionField = fields?.dimensions?.[0];
    const valueMeasureField = fields?.metrics?.[0];
    const targetMeasureField = fields?.metrics?.[1];
    const historicalValueMeasureField = fields?.metrics?.[2];

    // Validate required fields exist
    if (!dateDimensionField?.name || !valueMeasureField?.name) {
      throw new Error('Required fields (date dimension and value measure) are missing');
    }

    return tables?.DEFAULT?.map((row, index) => {
      try {
        // Access data from dimensions and metrics arrays
        const dateValue = row?.dimension?.[0];
        const valueMeasure = row?.metric?.[0];
        const targetMeasure = targetMeasureField ? row?.metric?.[1] : null;
        const historicalValueMeasure = historicalValueMeasureField ? row?.metric?.[2] : null;

        // Validate date
        const parsedDate = new Date(dateValue);
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Invalid date value at row ${index + 1}: ${dateValue}`);
        }

        // Parse and validate numeric values
        const parsedValue = parseFloat(valueMeasure);
        if (isNaN(parsedValue)) {
          console.warn(`Invalid value measure at row ${index + 1}, defaulting to 0`);
        }

        return {
          date: parsedDate,
          value: parsedValue || 0,
          target: targetMeasure ? parseFloat(targetMeasure) || null : null,
          historicalValue: historicalValueMeasure ? parseFloat(historicalValueMeasure) || null : null
        };
      } catch (rowError) {
        console.error(`Error processing row ${index + 1}:`, rowError);
        return null;
      }
    }).filter(row => row !== null); // Remove any rows that failed to parse

  } catch (error) {
    console.error('Error parsing data:', error);
    throw new Error(`Failed to parse data: ${error.message}`);
  }
}

/**
 * Aggregates daily data into weekly buckets
 * @param {Array} data - Parsed data array
 * @returns {Array} Weekly aggregated data
 * @throws {Error} If input data is invalid
 */
export function aggregateToWeekly(data) {
  if (!Array.isArray(data)) {
    throw new Error('Input data must be an array');
  }

  const weeklyMap = new Map();
  
  data.forEach((item, index) => {
    try {
      if (!item.date || !item.value) {
        console.warn(`Skipping invalid item at index ${index}`);
        return;
      }

      const weekStart = getWeekStart(item.date);
      const weekKey = weekStart.toISOString();
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          date: weekStart,
          value: 0,
          target: null,
          historicalValue: null,
          count: 0
        });
      }
      
      const week = weeklyMap.get(weekKey);
      week.value += item.value;
      if (item.target != null) week.target = (week.target || 0) + item.target;
      if (item.historicalValue != null) week.historicalValue = (week.historicalValue || 0) + item.historicalValue;
      week.count++;
    } catch (itemError) {
      console.error(`Error processing item ${index}:`, itemError);
    }
  });
  
  // Calculate averages and sort by date
  return Array.from(weeklyMap.values())
    .map(week => ({
      date: week.date,
      value: week.value / week.count,
      target: week.target ? week.target / week.count : null,
      historicalValue: week.historicalValue ? week.historicalValue / week.count : null
    }))
    .sort((a, b) => a.date - b.date);
}

/**
 * Calculates various growth rates for the data
 * @param {Array} data - Processed data array
 * @returns {Object} Object containing different growth rate calculations
 */
export function calculateGrowthRates(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      weekOverWeek: null,
      yearOverYear: null,
      monthToDate: null,
      quarterToDate: null,
      yearToDate: null
    };
  }
  
  try {
    const current = data[data.length - 1].value;
    const previous = data[data.length - 2]?.value;
    const yearAgo = data[data.length - 1].historicalValue;
    
    return {
      weekOverWeek: previous != null ? ((current - previous) / previous) * 100 : null,
      yearOverYear: yearAgo != null ? ((current - yearAgo) / yearAgo) * 100 : null,
      monthToDate: calculateMTD(data),
      quarterToDate: calculateQTD(data),
      yearToDate: calculateYTD(data)
    };
  } catch (error) {
    console.error('Error calculating growth rates:', error);
    return {
      weekOverWeek: null,
      yearOverYear: null,
      monthToDate: null,
      quarterToDate: null,
      yearToDate: null
    };
  }
}

// Helper functions

/**
 * Gets the start of the week for a given date
 * @param {Date} date - Input date
 * @returns {Date} Date object set to the start of the week
 */
function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Set to Sunday
  return d;
}

/**
 * Calculates month-to-date growth
 * @param {Array} data - Processed data array
 * @returns {number|null} Month-to-date growth rate or null if cannot be calculated
 */
function calculateMTD(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  try {
    const currentDate = new Date(data[data.length - 1].date);
    const currentValue = data[data.length - 1].value;
    const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const monthStartValue = data.find(d => new Date(d.date) >= firstOfMonth)?.historicalValue;
    
    return monthStartValue ? ((currentValue - monthStartValue) / monthStartValue) * 100 : null;
  } catch (error) {
    console.error('Error calculating MTD:', error);
    return null;
  }
}

/**
 * Calculates quarter-to-date growth
 * @param {Array} data - Processed data array
 * @returns {number|null} Quarter-to-date growth rate or null if cannot be calculated
 */
function calculateQTD(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  try {
    const currentDate = new Date(data[data.length - 1].date);
    const currentValue = data[data.length - 1].value;
    const currentQuarter = Math.floor(currentDate.getMonth() / 3);
    const firstOfQuarter = new Date(currentDate.getFullYear(), currentQuarter * 3, 1);
    
    const quarterStartValue = data.find(d => new Date(d.date) >= firstOfQuarter)?.historicalValue;
    
    return quarterStartValue ? ((currentValue - quarterStartValue) / quarterStartValue) * 100 : null;
  } catch (error) {
    console.error('Error calculating QTD:', error);
    return null;
  }
}

/**
 * Calculates year-to-date growth
 * @param {Array} data - Processed data array
 * @returns {number|null} Year-to-date growth rate or null if cannot be calculated
 */
function calculateYTD(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  try {
    const currentDate = new Date(data[data.length - 1].date);
    const currentValue = data[data.length - 1].value;
    const firstOfYear = new Date(currentDate.getFullYear(), 0, 1);
    
    const yearStartValue = data.find(d => new Date(d.date) >= firstOfYear)?.historicalValue;
    
    return yearStartValue ? ((currentValue - yearStartValue) / yearStartValue) * 100 : null;
  } catch (error) {
    console.error('Error calculating YTD:', error);
    return null;
  }
}