import { select } from 'd3-selection';
import { jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import { parseData, aggregateToWeekly, calculateGrowthRates } from '../dataProcessor';
import { drawGraph, drawBoxScores } from '../chartRenderer';
import { getTrailingWeeks, formatDate } from '../utils';

describe('Data Processing Tests', () => {
  // Sample test data
  const sampleLookerData = [
    {
      "dimension1": { value: "2024-01-01" },
      "measure1": { value: "100" },
      "measure2": { value: "110" },
      "measure3": { value: "95" }
    },
    {
      "dimension1": { value: "2024-01-02" },
      "measure1": { value: "120" },
      "measure2": { value: "115" },
      "measure3": { value: "105" }
    }
  ];

  const sampleQueryResponse = {
    fields: {
      dimensions: [{ name: "dimension1" }],
      measures: [
        { name: "measure1" },
        { name: "measure2" },
        { name: "measure3" }
      ]
    }
  };

  test('parseData correctly transforms Looker data', () => {
    const parsed = parseData(sampleLookerData, sampleQueryResponse);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toHaveProperty('date');
    expect(parsed[0]).toHaveProperty('value');
    expect(parsed[0]).toHaveProperty('target');
    expect(parsed[0]).toHaveProperty('historicalValue');
  });

  test('parseData handles missing or null values', () => {
    const dataWithNulls = [
      {
        "dimension1": { value: "2024-01-01" },
        "measure1": { value: null },
        "measure2": { value: undefined },
        "measure3": { value: "95" }
      }
    ];
    
    const parsed = parseData(dataWithNulls, sampleQueryResponse);
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
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('drawGraph creates SVG element with correct dimensions', () => {
    const data = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 }
    ];
    const config = { showHistorical: true, showTargets: true };
    
    drawGraph(select(container), data, config);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBeTruthy();
    expect(svg.getAttribute('height')).toBeTruthy();
  });

  test('drawGraph renders main line, historical line, and targets', () => {
    const data = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 },
      { date: new Date('2024-01-02'), value: 120, target: 115, historicalValue: 105 }
    ];
    const config = { showHistorical: true, showTargets: true };
    
    drawGraph(select(container), data, config);
    
    expect(container.querySelector('.main-line')).toBeTruthy();
    expect(container.querySelector('.historical-line')).toBeTruthy();
    expect(container.querySelector('.target-triangle')).toBeTruthy();
  });

  test('drawBoxScores renders all required metrics', () => {
    const boxScoresData = {
      lastWeek: 100,
      wow: 5.2,
      yoy: 10.5,
      mtd: 15.3,
      qtd: 8.7,
      ytd: 12.4
    };
    
    drawBoxScores(select(container), boxScoresData, {});
    
    const scoreItems = container.querySelectorAll('.score-item');
    expect(scoreItems).toHaveLength(6); // Should have 6 metrics
  });
});

describe('User Configuration Tests', () => {
  test('configuration changes are reflected in visualization', () => {
    const container = document.createElement('div');
    const data = [
      { date: new Date('2024-01-01'), value: 100, target: 110, historicalValue: 95 }
    ];
    
    // Test with historical data hidden
    let config = { showHistorical: false, showTargets: true };
    drawGraph(select(container), data, config);
    expect(container.querySelector('.historical-line')).toBeNull();
    
    // Test with targets hidden
    config = { showHistorical: true, showTargets: false };
    drawGraph(select(container), data, config);
    expect(container.querySelector('.target-triangle')).toBeNull();
  });
});

describe('Edge Case Tests', () => {
  test('handles empty dataset', () => {
    const emptyData = [];
    const growth = calculateGrowthRates(emptyData);
    expect(growth).toEqual({});
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
    // Generate large dataset
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      date: new Date(2024, 0, i + 1),
      value: Math.random() * 1000,
      target: Math.random() * 1000,
      historicalValue: Math.random() * 1000
    }));
    
    const startTime = performance.now();
    
    // Process data
    const weekly = aggregateToWeekly(largeData);
    const growth = calculateGrowthRates(weekly);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Processing should take less than 100ms for 1000 records
    expect(processingTime).toBeLessThan(100);
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
    
    drawGraph(select(container), largeData, { showHistorical: true, showTargets: true });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Rendering should take less than 200ms for 100 data points
    expect(renderTime).toBeLessThan(200);
  });
}); 