import { select, selectAll } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, symbol, symbolTriangle } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { format } from 'd3-format';
import { extent, max } from 'd3-array';
import { timeFormat } from 'd3-time-format';

/**
 * Draws the main graph visualization
 * @param {HTMLElement} container - DOM container element
 * @param {Array} data - Processed data array
 * @param {Object} config - Configuration options
 */
export function drawGraph(container, data, config) {
  try {
    // Clear existing content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Set up dimensions with error handling
    const margin = { top: 40, right: 20, bottom: 50, left: 60 };
    const containerWidth = container.clientWidth || 600; // Fallback width
    const containerHeight = container.clientHeight || 400; // Fallback height
    const width = Math.max(containerWidth - margin.left - margin.right, 200); // Minimum width
    const height = Math.max(containerHeight - margin.top - margin.bottom, 200); // Minimum height
    
    // Create SVG with D3
    const svg = select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Add graph number if specified
    if (config.graphNumber) {
      svg.append("text")
        .attr("x", -margin.left)
        .attr("y", -margin.top/2)
        .attr("class", "graph-number")
        .text(`Graph ${config.graphNumber}`);
    }
    
    // Validate data
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid or empty data array');
    }
    
    // Create scales with validation
    const xDomain = extent(data, d => d.date);
    const yMax = max(data, d => Math.max(
      d.value || 0,
      d.target || 0,
      d.historicalValue || 0
    ));
    
    if (!xDomain[0] || !xDomain[1] || !yMax) {
      throw new Error('Invalid data ranges');
    }
    
    const xScale = scaleTime()
      .domain(xDomain)
      .range([0, width]);
      
    const yScale = scaleLinear()
      .domain([0, yMax * 1.1]) // Add 10% padding
      .range([height, 0])
      .nice();
      
    // Draw components with error handling
    try {
      drawAxes(svg, xScale, yScale, height, config);
      drawMainLine(svg, data, xScale, yScale, config);
      
      if (config.showHistorical?.value) {
        drawHistoricalLine(svg, data, xScale, yScale, config);
      }
      
      if (config.showTargets?.value) {
        drawTargets(svg, data, xScale, yScale, config);
      }
      
      addDataLabels(svg, data, xScale, yScale, config);
    } catch (componentError) {
      console.error('Error drawing graph component:', componentError);
      throw componentError;
    }
    
  } catch (error) {
    console.error('Error rendering graph:', error);
    container.innerHTML = `
      <div class="error-message">
        Unable to render graph: ${error.message}
      </div>
    `;
  }
}

/**
 * Draws the box scores below the graph
 * @param {HTMLElement} container - DOM container element
 * @param {Object} data - Box scores data
 * @param {Object} config - Configuration options
 */
export function drawBoxScores(container, data, config) {
  try {
    const boxScoresDiv = document.createElement('div');
    boxScoresDiv.className = 'box-scores';
    
    // Create box score items
    const items = [
      { label: "Last Week", value: formatValue(data.lastWeek) },
      { label: "WoW", value: formatPercent(data.wow) },
      { label: "YoY", value: formatPercent(data.yoy) },
      { label: "MTD", value: formatPercent(data.mtd) },
      { label: "QTD", value: formatPercent(data.qtd) },
      { label: "YTD", value: formatPercent(data.ytd) }
    ];
    
    items.forEach(item => {
      const scoreDiv = document.createElement('div');
      scoreDiv.className = 'score-item';
      
      const labelDiv = document.createElement('div');
      labelDiv.className = 'score-label';
      labelDiv.textContent = item.label;
      
      const valueDiv = document.createElement('div');
      valueDiv.className = 'score-value';
      valueDiv.textContent = item.value;
      
      scoreDiv.appendChild(labelDiv);
      scoreDiv.appendChild(valueDiv);
      boxScoresDiv.appendChild(scoreDiv);
    });
    
    container.appendChild(boxScoresDiv);
    
  } catch (error) {
    console.error('Error rendering box scores:', error);
    container.innerHTML += `
      <div class="error-message">
        Unable to render box scores: ${error.message}
      </div>
    `;
  }
}

// Helper functions with error handling

function drawAxes(svg, xScale, yScale, height, config) {
  try {
    const xAxis = axisBottom(xScale)
      .ticks(config.isWeeklyView ? 6 : 12)
      .tickFormat(timeFormat(config.isWeeklyView ? '%m/%d' : '%b %Y'));

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'x-axis')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'y-axis')
      .call(axisLeft(yScale));
  } catch (error) {
    console.error('Error drawing axes:', error);
    throw error;
  }
}

function drawMainLine(svg, data, xScale, yScale, config) {
  const lineGenerator = line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value));

  svg
    .append('path')
    .datum(data)
    .attr('class', 'main-line')
    .attr('fill', 'none')
    .attr('stroke', config.lineColor?.value?.color || '#3366CC')
    .attr('stroke-width', 2)
    .attr('d', lineGenerator);
}

function drawHistoricalLine(svg, data, xScale, yScale, config) {
  const lineGenerator = line()
    .defined((d) => d.historicalValue != null)
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.historicalValue));

  svg
    .append('path')
    .datum(data.filter((d) => d.historicalValue != null))
    .attr('class', 'historical-line')
    .attr('fill', 'none')
    .attr('stroke', (config.historicalLineColor?.value?.color) || '#FF9999')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0.7)
    .attr('d', lineGenerator);
}

function drawTargets(svg, data, xScale, yScale, config) {
  const symbolGenerator = symbol()
    .type(symbolTriangle)
    .size(64);

  svg
    .selectAll('.target-triangle')
    .data(data.filter((d) => d.target != null))
    .enter()
    .append('path')
    .attr('class', 'target-triangle')
    .attr('d', symbolGenerator)
    .attr(
      'transform',
      (d) => `translate(${xScale(d.date)},${yScale(d.target)})`
    )
    .attr('fill', config.targetColor?.value?.color || '#00AA00');
}

function addDataLabels(svg, data, xScale, yScale, config) {
  svg
    .selectAll('.value-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'value-label')
    .attr('x', (d) => xScale(d.date))
    .attr('y', (d) => yScale(d.value) - 10)
    .attr('text-anchor', 'middle')
    .text((d) => formatValue(d.value));
}

function formatValue(value) {
  try {
    return value != null ? format(',.0f')(value) : 'N/A';
  } catch (error) {
    console.error('Error formatting value:', error);
    return 'Error';
  }
}

function formatPercent(value) {
  try {
    return value != null ? format('+.1f')(value) + '%' : 'N/A';
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return 'Error';
  }
} 