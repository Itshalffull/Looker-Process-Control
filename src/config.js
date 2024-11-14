/**
 * Default configuration options for the graph visualizations
 */
export const DEFAULT_OPTIONS = {
  // Data Configuration
  metric: {
    type: "string",
    label: "Metric",
    section: "Data",
    display: "select",
    values: [] // Populated dynamically from available fields
  },
  date_dimension: {
    type: "string",
    label: "Date Dimension",
    section: "Data",
    display: "select",
    values: [] // Populated dynamically
  },
  target_metric: {
    type: "string",
    label: "Target Metric",
    section: "Data",
    display: "select",
    values: [], // Populated dynamically
    required: false
  },

  // Display Options
  show_historical: {
    type: "boolean",
    label: "Show Historical Data",
    default: true,
    section: "Display"
  },
  show_targets: {
    type: "boolean",
    label: "Show Targets",
    default: true,
    section: "Display"
  },
  show_growth_rates: {
    type: "boolean",
    label: "Show Growth Rates",
    default: true,
    section: "Display"
  },
  graph_number: {
    type: "number",
    label: "Graph Number",
    default: 1,
    section: "Display"
  },

  // Style Configuration
  line_color: {
    type: "string",
    label: "Line Color",
    display: "color",
    default: "#3366CC",
    section: "Style"
  },
  historical_line_color: {
    type: "string",
    label: "Historical Line Color",
    display: "color",
    default: "#FF9999",
    section: "Style"
  },
  target_color: {
    type: "string",
    label: "Target Color",
    display: "color",
    default: "#00AA00",
    section: "Style"
  }
}; 