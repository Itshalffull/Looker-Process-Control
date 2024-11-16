/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import { parseData, aggregateToWeekly, calculateGrowthRates } from '../dataProcessor';
import { drawGraph, drawBoxScores } from '../chartRenderer';
import { getTrailingWeeks, formatDate } from '../utils';

// Sample data accessible throughout tests
const sampleLookerStudioData = {
  tables: {
    DEFAULT: [
      {
        dateDimension: "2024-01-01",
        valueMeasure: 100,
        targetMeasure: 110,
        historicalValueMeasure: 95
      },
      {
        dateDimension: "2024-01-02",
        valueMeasure: 120,
        targetMeasure: 115,
        historicalValueMeasure: 105
      }
    ]
  },
  fields: {
    dateDimension: [{ name: "dateDimension" }],
    valueMeasure: [{ name: "valueMeasure" }],
    targetMeasure: [{ name: "targetMeasure" }],
    historicalValueMeasure: [{ name: "historicalValueMeasure" }]
  },
  style: {
    lineColor: { value: { color: "#3366CC" } },
    showHistorical: { value: true },
    showTargets: { value: true }
  }
};

describe('Data Processing Tests', () => {
  test('parseData correctly transforms Looker Studio data', () => {
    const parsed = parseData(sampleLookerStudioData);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toHaveProperty('date');
    expect(parsed[0]).toHaveProperty('value');
    expect(parsed[0]).toHaveProperty('target');
    expect(parsed[0]).toHaveProperty('historicalValue');
  });

  test('parseData handles missing or null values', () => {
    const dataWithNulls = {
      tables: {
        DEFAULT: [{
          dateDimension: "2024-01-01",
          valueMeasure: null,
          targetMeasure: undefined,
          historicalValueMeasure: 95
        }]
      },
      fields: sampleLookerStudioData.fields
    };
    
    const parsed = parseData(dataWithNulls);
    expect(parsed[0].value).toBe(0); // Should default to 0
    expect(parsed[0].target).toBeNull();
  });

  test('aggregateToWeekly correctly groups daily data', () => {
    const dailyData = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 },
      { date: new Date('2024-01-02'), value: 120, target: 115, historicalValue: 105 },
      { date: new Date('2024-01-03'), value: 110, target: 112, historicalValue: 100 }
    ];

    const weekly = aggregateToWeekly(dailyData);
    expect(weekly).toHaveLength(1); // Should combine into one week
    expect(weekly[0].value).toBe(110); // Average of 100, 120, 110
  });
});

describe('Rendering Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('drawGraph creates SVG element with correct dimensions', () => {
    const container = document.createElement('div');
    const data = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 }
    ];
    
    const config = { 
      showHistorical: { value: true }, 
      showTargets: { value: true },
      lineColor: { value: { color: "#3366CC" } }
    };
    
    drawGraph(container, data, config);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBeTruthy();
    expect(svg.getAttribute('height')).toBeTruthy();
  });

  test('drawGraph renders main line, historical line, and targets', () => {
    const container = document.createElement('div');
    const data = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 },
      { date: new Date('2024-01-02'), value: 120, target: 115, historicalValue: 105 }
    ];
    
    const config = { 
      showHistorical: { value: true }, 
      showTargets: { value: true },
      lineColor: { value: { color: "#3366CC" } },
      historicalLineColor: { value: { color: "#FF9999" } },
      targetColor: { value: { color: "#00AA00" } }
    };
    
    drawGraph(container, data, config);
    
    expect(container.querySelector('.main-line')).toBeTruthy();
    expect(container.querySelector('.historical-line')).toBeTruthy();
    expect(container.querySelector('.target-triangle')).toBeTruthy();
  });

  test('drawBoxScores renders all required metrics', () => {
    const container = document.createElement('div');
    const boxScoresData = {
      lastWeek: 100,
      wow: 5.2,
      yoy: 10.5,
      mtd: 15.3,
      qtd: 8.7,
      ytd: 12.4
    };
    
    drawBoxScores(container, boxScoresData, {});
    
    const scoreItems = container.querySelectorAll('.score-item');
    expect(scoreItems.length).toBe(6); // Should have 6 metrics
  });
});

describe('User Configuration Tests', () => {
  test('configuration changes are reflected in visualization', () => {
    const container = document.createElement('div');
    const data = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 }
    ];
    
    // Test with historical data hidden
    const configNoHistorical = { 
      showHistorical: { value: false }, 
      showTargets: { value: true },
      lineColor: { value: { color: "#3366CC" } }
    };
    
    drawGraph(container, data, configNoHistorical);
    expect(container.querySelector('.historical-line')).toBeFalsy();
    
    // Test with targets hidden
    const configNoTargets = { 
      showHistorical: { value: true }, 
      showTargets: { value: false },
      lineColor: { value: { color: "#3366CC" } }
    };
    
    drawGraph(container, data, configNoTargets);
    expect(container.querySelector('.target-triangle')).toBeFalsy();
  });

  test('color configuration changes are applied', () => {
    const container = document.createElement('div');
    const data = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 }
    ];
    
    const config = { 
      showHistorical: { value: true }, 
      showTargets: { value: true },
      lineColor: { value: { color: "#FF0000" } },
      historicalLineColor: { value: { color: "#00FF00" } },
      targetColor: { value: { color: "#0000FF" } }
    };
    
    drawGraph(container, data, config);
    
    const mainLine = container.querySelector('.main-line');
    const historicalLine = container.querySelector('.historical-line');
    const targetTriangle = container.querySelector('.target-triangle');
    
    expect(mainLine.getAttribute('stroke')).toBe('#FF0000');
    expect(historicalLine.getAttribute('stroke')).toBe('#00FF00');
    expect(targetTriangle.getAttribute('fill')).toBe('#0000FF');
  });
});

describe('Edge Case Tests', () => {
  test('handles empty dataset', () => {
    const emptyData = [];
    const growth = calculateGrowthRates(emptyData);
    expect(growth).toEqual({
      weekOverWeek: null,
      yearOverYear: null,
      monthToDate: null,
      quarterToDate: null,
      yearToDate: null
    });
  });

  test('handles single data point', () => {
    const singlePoint = [
      { date: new Date('2024-01-01'), value: 100 }
    ];
    const growth = calculateGrowthRates(singlePoint);
    expect(growth.weekOverWeek).toBeNull();
    expect(growth.yearOverYear).toBeNull();
  });

  test('handles missing historical data', () => {
    const dataNoHistorical = [
      { date: new Date('2024-01-01'), value: 100, target: 110 }
    ];
    const growth = calculateGrowthRates(dataNoHistorical);
    expect(growth.yearOverYear).toBeNull();
  });
});

describe('Performance Tests', () => {
  test('processes large datasets efficiently', () => {
    const largeData = {
      tables: {
        DEFAULT: Array.from({ length: 1000 }, (_, i) => ({
          dateDimension: new Date(2024, 0, i + 1).toISOString(),
          valueMeasure: Math.random() * 1000,
          targetMeasure: Math.random() * 1000,
          historicalValueMeasure: Math.random() * 1000
        }))
      },
      fields: sampleLookerStudioData.fields
    };
    
    const startTime = performance.now();
    
    const parsed = parseData(largeData);
    const weekly = aggregateToWeekly(parsed);
    const growth = calculateGrowthRates(weekly);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    expect(processingTime).toBeLessThan(100); // Should process in under 100ms
  });

  test('renders large datasets efficiently', () => {
    const container = document.createElement('div');
    const largeData = Array.from({ length: 100 }, (_, i) => ({
      date: new Date(2024, 0, i + 1),
      value: Math.random() * 1000,
      target: Math.random() * 1000,
      historicalValue: Math.random() * 1000
    }));
    
    const startTime = performance.now();
    
    drawGraph(container, largeData, {
      showHistorical: { value: true },
      showTargets: { value: true },
      lineColor: { value: { color: "#3366CC" } }
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200); // Should render in under 200ms
  });
}); 