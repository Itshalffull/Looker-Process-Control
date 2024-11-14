/**
 * Functions for processing and transforming data for the graph visualizations
 */


/**
 * Parses raw Looker data into a standardized format
 * @param {Array} data - Raw data from Looker
 * @param {Object} queryResponse - Query response object from Looker
 * @returns {Array} Parsed data array
 */
export function parseData(data, queryResponse) {
  const fields = queryResponse.fields;
  return data.map(row => {
    return {
      date: new Date(row[fields.dimensions[0].name].value),
      value: parseFloat(row[fields.measures[0].name].value) || 0,
      target: row[fields.measures[1]?.name]?.value ? 
        parseFloat(row[fields.measures[1].name].value) : null,
      historicalValue: row[fields.measures[2]?.name]?.value ?
        parseFloat(row[fields.measures[2].name].value) : null
    };
  });
}

/**
 * Aggregates daily data into weekly buckets
 * @param {Array} data - Parsed data array
 * @returns {Array} Weekly aggregated data
 */
export function aggregateToWeekly(data) {
  const weeklyMap = new Map();
  
  data.forEach(item => {
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
    if (item.target) week.target = (week.target || 0) + item.target;
    if (item.historicalValue) week.historicalValue = (week.historicalValue || 0) + item.historicalValue;
    week.count++;
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
  if (!data || data.length === 0) return {};
  
  const current = data[data.length - 1].value;
  const previous = data[data.length - 2]?.value;
  const yearAgo = data[data.length - 1].historicalValue;
  
  // Calculate month-to-date, quarter-to-date, and year-to-date
  const mtd = calculateMTD(data);
  const qtd = calculateQTD(data);
  const ytd = calculateYTD(data);
  
  return {
    weekOverWeek: previous ? ((current - previous) / previous) * 100 : null,
    yearOverYear: yearAgo ? ((current - yearAgo) / yearAgo) * 100 : null,
    monthToDate: mtd,
    quarterToDate: qtd,
    yearToDate: ytd
  };
}

// Helper functions

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Set to Sunday
  return d;
}

function calculateMTD(data) {
  if (!data || data.length === 0) return null;
  
  const currentDate = new Date(data[data.length - 1].date);
  const currentValue = data[data.length - 1].value;
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Find the value from the start of the current month
  const monthStartValue = data.find(d => new Date(d.date) >= firstOfMonth)?.historicalValue;
  
  if (!monthStartValue) return null;
  
  return ((currentValue - monthStartValue) / monthStartValue) * 100;
}

function calculateQTD(data) {
  if (!data || data.length === 0) return null;
  
  const currentDate = new Date(data[data.length - 1].date);
  const currentValue = data[data.length - 1].value;
  const currentQuarter = Math.floor(currentDate.getMonth() / 3);
  const firstOfQuarter = new Date(currentDate.getFullYear(), currentQuarter * 3, 1);
  
  // Find the value from the start of the current quarter
  const quarterStartValue = data.find(d => new Date(d.date) >= firstOfQuarter)?.historicalValue;
  
  if (!quarterStartValue) return null;
  
  return ((currentValue - quarterStartValue) / quarterStartValue) * 100;
}

function calculateYTD(data) {
  if (!data || data.length === 0) return null;
  
  const currentDate = new Date(data[data.length - 1].date);
  const currentValue = data[data.length - 1].value;
  const firstOfYear = new Date(currentDate.getFullYear(), 0, 1);
  
  // Find the value from the start of the current year
  const yearStartValue = data.find(d => new Date(d.date) >= firstOfYear)?.historicalValue;
  
  if (!yearStartValue) return null;
  
  return ((currentValue - yearStartValue) / yearStartValue) * 100;
}