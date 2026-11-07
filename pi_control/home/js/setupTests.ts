import '@testing-library/jest-dom';
import * as React from 'react';

// Ensure root element exists for app.tsx side effect
if (typeof document !== 'undefined' && !document.getElementById('root')) {
  const root = document.createElement('div');
  root.setAttribute('id', 'root');
  document.body.appendChild(root);
}

// Canvas mock for jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })) as any;
}

// Global amCharts 4 stub
jest.mock('@amcharts/amcharts4/core', () => ({
  useTheme: jest.fn(),
  color: jest.fn((val: any) => val),
  create: jest.fn(() => ({
    paddingRight: 0,
    paddingLeft: 0,
    data: [],
    xAxes: { push: jest.fn(() => ({ renderer: { grid: { template: {} } } })) },
    yAxes: { push: jest.fn(() => ({ renderer: { minWidth: 30, opposite: false }, title: {}, tooltip: {} })) },
    series: { push: jest.fn(() => ({ dataFields: {}, renderer: {} })) },
    cursor: null,
    scrollbarX: null,
    dispose: jest.fn(),
  })),
}));

jest.mock('@amcharts/amcharts4/charts', () => ({
  XYChart: jest.fn(),
  DateAxis: jest.fn(),
  ValueAxis: jest.fn(),
  LineSeries: jest.fn(),
  XYCursor: jest.fn(),
  XYChartScrollbar: jest.fn(() => ({ series: { push: jest.fn() } })),
}));

jest.mock('@amcharts/amcharts4/themes/animated', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Global react-chartjs-2 stub
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) =>
    React.createElement('div', {
      'data-testid': 'chartjs-line',
      'data-chart-data': JSON.stringify(props.data),
      'data-chart-options': JSON.stringify(props.options),
      className: props.className,
    }),
}));

// Global chartjs-adapter-date-fns stub
jest.mock('chartjs-adapter-date-fns', () => ({}));



