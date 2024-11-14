import { parseData, aggregateToWeekly, calculateGrowthRates } from './dataProcessor';
import { drawGraph, drawBoxScores } from './chartRenderer';
import { getTrailingWeeks, formatDate } from './utils';
import { DEFAULT_OPTIONS } from './config';

looker.plugins.visualizations.add({
  id: "six_week_graph",
  label: "6-Week Graph",
  options: DEFAULT_OPTIONS,

  create: function(element, config) {
    element.innerHTML = "";
    this.container = d3.select(element)
      .append("div")
      .attr("class", "six-week-graph-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    try {
      // Clear any existing content
      this.container.html("");

      // Parse and process data
      const parsedData = parseData(data, queryResponse);
      const weeklyData = aggregateToWeekly(parsedData);
      const trailingData = getTrailingWeeks(weeklyData, 6);
      const growthRates = calculateGrowthRates(trailingData);

      // Draw the main graph
      drawGraph(this.container, trailingData, {
        ...config,
        isWeeklyView: true,
        graphNumber: config.graph_number || 1
      });

      // Draw box scores
      const boxScoresData = {
        lastWeek: trailingData[trailingData.length - 1].value,
        wow: growthRates.weekOverWeek,
        yoy: growthRates.yearOverYear,
        mtd: growthRates.monthToDate,
        qtd: growthRates.quarterToDate,
        ytd: growthRates.yearToDate
      };

      drawBoxScores(this.container, boxScoresData, config);
      
      done();
    } catch (error) {
      console.error('Error in 6-Week Graph:', error);
      done(error);
    }
  }
}); 