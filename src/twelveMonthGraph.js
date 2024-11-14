import { parseData, aggregateToWeekly, calculateGrowthRates } from './dataProcessor';
import { drawGraph, drawBoxScores } from './chartRenderer';
import { getMonthStart, formatDate } from './utils';
import { DEFAULT_OPTIONS } from './config';

looker.plugins.visualizations.add({
  id: "twelve_month_graph",
  label: "12-Month Graph",
  options: DEFAULT_OPTIONS,

  create: function(element, config) {
    element.innerHTML = "";
    this.container = d3.select(element)
      .append("div")
      .attr("class", "twelve-month-graph-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    try {
      // Clear any existing content
      this.container.html("");

      // Parse and process data
      const parsedData = parseData(data, queryResponse);
      const weeklyData = aggregateToWeekly(parsedData);
      
      // Get last 12 months of data
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
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

      const growthRates = calculateGrowthRates(monthlyDataArray);

      // Draw the main graph
      drawGraph(this.container, monthlyDataArray, {
        ...config,
        isWeeklyView: false,
        graphNumber: config.graph_number || 1
      });

      // Draw box scores
      const boxScoresData = {
        lastWeek: monthlyDataArray[monthlyDataArray.length - 1].value,
        wow: growthRates.weekOverWeek,
        yoy: growthRates.yearOverYear,
        mtd: growthRates.monthToDate,
        qtd: growthRates.quarterToDate,
        ytd: growthRates.yearToDate
      };

      drawBoxScores(this.container, boxScoresData, config);
      
      done();
    } catch (error) {
      console.error('Error in 12-Month Graph:', error);
      done(error);
    }
  }
}); 