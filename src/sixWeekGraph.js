import * as dscc from '@google/dscc';
import { parseData, aggregateToWeekly, calculateGrowthRates } from './dataProcessor';
import { drawGraph, drawBoxScores } from './chartRenderer';
import { getTrailingWeeks } from './utils';

const LOCAL_STYLE_CONFIG = {
  lineColor: '#3366CC',
  showHistorical: true,
  historicalLineColor: '#FF9999',
  showTargets: true,
  targetColor: '#00AA00',
  graphNumber: 1,
  isWeeklyView: true
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
      isWeeklyView: true
    };

    // Process data with validation
    const parsedData = parseData(data);
    if (!parsedData || parsedData.length === 0) {
      container.innerHTML = '<div class="error">No valid data available to display</div>';
      return;
    }

    const weeklyData = aggregateToWeekly(parsedData);
    const trailingData = getTrailingWeeks(weeklyData, 6);
    const growthRates = calculateGrowthRates(trailingData);

    // Validate processed data
    if (!trailingData || trailingData.length === 0) {
      container.innerHTML = '<div class="error">Insufficient data for visualization</div>';
      return;
    }

    // Draw the main graph
    drawGraph(container, trailingData, config);

    // Prepare and validate box scores data
    const lastValue = trailingData[trailingData.length - 1]?.value;
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
    console.error('Error in 6-Week Graph:', error);
    
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

// Subscribe to data and style changes
dscc.subscribeToData(drawViz, { 
  transform: dscc.objectTransform,
  style: true  // Explicitly enable style updates
}); 