/**
 * Default configuration options for the graph visualizations
 */
export const DEFAULT_CONFIG = {
  data: [
    {
      id: "concepts",
      label: "Data",
      elements: [
        {
          id: "dateDimension",
          label: "Date Dimension",
          type: "DIMENSION",
          options: {
            min: 1,
            max: 1,
            supportedTypes: ["DATE"]
          }
        },
        {
          id: "valueMeasure",
          label: "Value Measure",
          type: "METRIC",
          options: {
            min: 1,
            max: 1
          }
        },
        {
          id: "targetMeasure",
          label: "Target Measure",
          type: "METRIC",
          options: {
            min: 0,
            max: 1
          }
        },
        {
          id: "historicalValueMeasure",
          label: "Historical Value Measure",
          type: "METRIC",
          options: {
            min: 0,
            max: 1
          }
        }
      ]
    }
  ],
  style: [
    {
      id: "display",
      label: "Display Options",
      elements: [
        {
          type: "CHECKBOX",
          id: "showHistorical",
          label: "Show Historical Data",
          defaultValue: true
        },
        {
          type: "CHECKBOX",
          id: "showTargets",
          label: "Show Targets",
          defaultValue: true
        },
        {
          type: "CHECKBOX",
          id: "showGrowthRates",
          label: "Show Growth Rates",
          defaultValue: true
        },
        {
          type: "NUMBER",
          id: "graph_number",
          label: "Graph Number",
          defaultValue: 1,
          options: {
            min: 1,
            max: 100
          }
        }
      ]
    },
    {
      id: "colors",
      label: "Color Options",
      elements: [
        {
          type: "FILL_COLOR",
          id: "lineColor",
          label: "Line Color",
          defaultValue: "#3366CC"
        },
        {
          type: "FILL_COLOR",
          id: "historicalLineColor",
          label: "Historical Line Color",
          defaultValue: "#FF9999"
        },
        {
          type: "FILL_COLOR",
          id: "targetColor",
          label: "Target Color",
          defaultValue: "#00AA00"
        }
      ]
    }
  ]
}; 