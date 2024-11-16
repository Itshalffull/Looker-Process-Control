import * as dscc from '@google/dscc';
import { parseData, aggregateToWeekly, calculateGrowthRates } from './dataProcessor';
import { drawGraph, drawBoxScores } from './chartRenderer';
import { getMonthStart, formatDate } from './utils';

const LOCAL_STYLE_CONFIG = {
  lineColor: '#3366CC',
  showHistorical: true,
  historicalLineColor: '#FF9999',
  showTargets: true,
  targetColor: '#00AA00',
  graphNumber: 1,
  isWeeklyView: false
};

function drawViz(data) {
  try {
    // Validate incoming data
    if (!data || !data.tables || !data.tables.DEFAULT) {
      throw new Error('No data received from Looker Studio');
    }

    // Set up container with error handling
    let container = document.getElementById('container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'container';
      container.className = 'twelve-month-graph-container';
      document.body.appendChild(container);
    }

    // Clear any existing content
    container.innerHTML = '';

    // Extract style configurations with type safety
    const config = {
      lineColor: data.style?.lineColor?.value?.color || LOCAL_STYLE_CONFIG.lineColor,
      showHistorical: data.style?.showHistorical?.value ?? LOCAL_STYLE_CONFIG.showHistorical,
      historicalLineColor: data.style?.historicalLineColor?.value?.color || LOCAL_STYLE_CONFIG.historicalLineColor,
      showTargets: data.style?.showTargets?.value ?? LOCAL_STYLE_CONFIG.showTargets,
      targetColor: data.style?.targetColor?.value?.color || LOCAL_STYLE_CONFIG.targetColor,
      graphNumber: data.style?.graph_number?.value || LOCAL_STYLE_CONFIG.graphNumber,
      isWeeklyView: false
    };

    // Process data with validation
    const parsedData = parseData(data);
    if (!parsedData || parsedData.length === 0) {
      container.innerHTML = '<div class="error">No valid data available to display</div>';
      return;
    }

    const weeklyData = aggregateToWeekly(parsedData);
    
    // Get last 12 months of data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    // Filter and aggregate monthly data
    const monthlyData = weeklyData
      .filter(d => d.date >= twelveMonthsAgo)
      .reduce((acc, curr) => {
        const monthKey = getMonthStart(curr.date).toISOString();
        if (!acc[monthKey]) {
          acc[monthKey] = {
            date: getMonthStart(curr.date),
            value: 0,
            target: curr.target,
            historicalValue: curr.historicalValue,
            count: 0
          };
        }
        acc[monthKey].value += curr.value;
        acc[monthKey].count++;
        return acc;
      }, {});

    // Convert to array and calculate averages
    const monthlyDataArray = Object.values(monthlyData)
      .map(month => ({
        date: month.date,
        value: month.value / month.count,
        target: month.target,
        historicalValue: month.historicalValue
      }))
      .sort((a, b) => a.date - b.date);

    // Validate processed data
    if (!monthlyDataArray || monthlyDataArray.length === 0) {
      container.innerHTML = '<div class="error">Insufficient data for visualization</div>';
      return;
    }

    const growthRates = calculateGrowthRates(monthlyDataArray);

    // Draw the main graph
    drawGraph(container, monthlyDataArray, config);

    // Prepare and validate box scores data
    const lastValue = monthlyDataArray[monthlyDataArray.length - 1]?.value;
    if (typeof lastValue === 'undefined') {
      console.warn('No current value available for box scores');
    }

    const boxScoresData = {
      lastWeek: lastValue || 0,
      wow: growthRates.weekOverWeek,
      yoy: growthRates.yearOverYear,
      mtd: growthRates.monthToDate,
      qtd: growthRates.quarterToDate,
      ytd: growthRates.yearToDate
    };

    // Draw box scores
    drawBoxScores(container, boxScoresData, config);

  } catch (error) {
    console.error('Error in 12-Month Graph:', error);
    
    // Display user-friendly error message
    const container = document.getElementById('container');
    if (container) {
      container.innerHTML = `
        <div class="error">
          Unable to display visualization. Please check your data configuration.
          ${error.message ? `<br>Error: ${error.message}` : ''}
        </div>
      `;
    }
  }
}

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Try to use imported dscc first
        if (dscc && typeof dscc.subscribeToData === 'function') {
            dscc.subscribeToData(drawViz, { 
                transform: dscc.objectTransform,
                style: true
            });
        } 
        // Fallback to global dscc
        else if (window.dscc && typeof window.dscc.subscribeToData === 'function') {
            window.dscc.subscribeToData(drawViz, { 
                transform: window.dscc.objectTransform,
                style: true
            });
        }
        else {
            console.error('DSCC library not found. Running in local development mode.');
            // Add mock data for local development
            drawViz({
                tables: {
                    DEFAULT: [
                        // Add some sample data here
                    ]
                },
                style: LOCAL_STYLE_CONFIG
            });
        }
    } catch (error) {
        console.error('Error initializing visualization:', error);
    }
});

// Export for webpack
export { drawViz }; 