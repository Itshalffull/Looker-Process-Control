import * as d3 from 'd3';

/**
 * Draws the main graph visualization
 * @param {Selection} container - D3 selection of the container element
 * @param {Array} data - Processed data array
 * @param {Object} config - Configuration options
 */
export function drawGraph(container, data, config) {
  // Clear existing content
  container.selectAll("svg").remove();
  
  // Set up dimensions
  const margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const width = container.node().offsetWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  // Create SVG
  const svg = container.append("svg")
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
  
  // Create scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);
    
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => Math.max(d.value, d.target || 0, d.historicalValue || 0))])
    .range([height, 0])
    .nice();
    
  // Draw axes
  drawAxes(svg, xScale, yScale, height, config);
  
  // Draw lines
  drawMainLine(svg, data, xScale, yScale, config);
  
  if (config.showHistorical) {
    drawHistoricalLine(svg, data, xScale, yScale, config);
  }
  
  // Draw targets
  if (config.showTargets) {
    drawTargets(svg, data, xScale, yScale, config);
  }
  
  // Add data labels
  addDataLabels(svg, data, xScale, yScale, config);
}

/**
 * Draws the box scores below the graph
 * @param {Selection} container - D3 selection of the container element
 * @param {Object} data - Box scores data
 * @param {Object} config - Configuration options
 */
export function drawBoxScores(container, data, config) {
  const boxScoresDiv = container.append("div")
    .attr("class", "box-scores");
    
  // Create box score items
  const items = [
    { label: "Last Week", value: formatValue(data.lastWeek) },
    { label: "WoW", value: formatPercent(data.wow) },
    { label: "YoY", value: formatPercent(data.yoy) },
    { label: "MTD", value: formatValue(data.mtd) },
    { label: "QTD", value: formatValue(data.qtd) },
    { label: "YTD", value: formatValue(data.ytd) }
  ];
  
  items.forEach(item => {
    const scoreDiv = boxScoresDiv.append("div")
      .attr("class", "score-item");
      
    scoreDiv.append("div")
      .attr("class", "score-label")
      .text(item.label);
      
    scoreDiv.append("div")
      .attr("class", "score-value")
      .text(item.value);
  });
}

// Helper functions

function drawAxes(svg, xScale, yScale, height, config) {
  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .ticks(config.isWeeklyView ? 6 : 12)
      .tickFormat(d3.timeFormat(config.isWeeklyView ? "%m/%d" : "%b %Y")));
    
  // Y axis
  svg.append("g")
    .call(d3.axisLeft(yScale));
}

function drawMainLine(svg, data, xScale, yScale, config) {
  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.value));
    
  svg.append("path")
    .datum(data)
    .attr("class", "main-line")
    .attr("fill", "none")
    .attr("stroke", config.lineColor || "#3366CC")
    .attr("stroke-width", 2)
    .attr("d", line);
}

function drawHistoricalLine(svg, data, xScale, yScale, config) {
  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.historicalValue))
    .defined(d => d.historicalValue != null);
    
  svg.append("path")
    .datum(data.filter(d => d.historicalValue != null))
    .attr("class", "historical-line")
    .attr("fill", "none")
    .attr("stroke", config.historicalLineColor || "#FF9999")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4")
    .attr("opacity", 0.7)
    .attr("d", line);
}

function drawTargets(svg, data, xScale, yScale, config) {
  svg.selectAll(".target-triangle")
    .data(data.filter(d => d.target != null))
    .enter()
    .append("path")
    .attr("class", "target-triangle")
    .attr("d", d3.symbol().type(d3.symbolTriangle).size(64))
    .attr("transform", d => `translate(${xScale(d.date)},${yScale(d.target)})`)
    .attr("fill", config.targetColor || "#00AA00");
}

function addDataLabels(svg, data, xScale, yScale, config) {
  svg.selectAll(".value-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "value-label")
    .attr("x", d => xScale(d.date))
    .attr("y", d => yScale(d.value) - 10)
    .attr("text-anchor", "middle")
    .text(d => formatValue(d.value));
}

function formatValue(value) {
  return value != null ? d3.format(",.0f")(value) : "N/A";
}

function formatPercent(value) {
  return value != null ? d3.format("+.1f")(value) + "%" : "N/A";
} 