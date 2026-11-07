import * as React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import { PingWidget } from '../network';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PingWidget Component', () => {
  const samplePingData = [
    { time: '2026-11-07T12:00:00Z', ping: 14.2 },
    { time: '2026-11-07T12:01:00Z', ping: 16.8 },
    { time: '2026-11-07T12:02:00Z', ping: 15.1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders card header "Latencia siete" and loading spinner initially', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));

    const { getByText, container } = render(<PingWidget />);

    expect(getByText('Latencia siete')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });

  it('renders Line chart with formatted datasets when API returns ping data', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: samplePingData });

    const { getByText, getByTestId, container } = render(<PingWidget />);

    expect(getByText('Latencia siete')).toBeInTheDocument();

    await waitFor(() => {
      expect(getByTestId('chartjs-line')).toBeInTheDocument();
    });

    const chartElem = getByTestId('chartjs-line');
    expect(chartElem).toHaveClass('card-img-bottom');

    const chartData = JSON.parse(chartElem.getAttribute('data-chart-data') || '{}');
    expect(chartData.labels).toEqual([
      '2026-11-07T12:00:00Z',
      '2026-11-07T12:01:00Z',
      '2026-11-07T12:02:00Z',
    ]);
    expect(chartData.datasets.length).toBe(1);
    expect(chartData.datasets[0].label).toBe('Ping latencia');
    expect(chartData.datasets[0].data).toEqual([14.2, 16.8, 15.1]);
    expect(chartData.datasets[0].borderColor).toBe('rgba(128, 128, 128, .8)');

    const chartOptions = JSON.parse(chartElem.getAttribute('data-chart-options') || '{}');
    expect(chartOptions.scales.y.title.text).toBe('Ping (ms)');
    expect(chartOptions.scales.y.suggestedMax).toBe(50);
    expect(chartOptions.scales.x.type).toBe('time');
  });

  it('remains in loading state if API returns empty data list', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    const { getByText, container, queryByTestId } = render(<PingWidget />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByText('Latencia siete')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();
    expect(queryByTestId('chartjs-line')).toBeNull();
  });

  it('periodically refreshes ping data every 15 seconds', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: samplePingData });

    const { getByTestId } = render(<PingWidget />);

    await waitFor(() => {
      expect(getByTestId('chartjs-line')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/network/list');

    const updatedPingData = [
      ...samplePingData,
      { time: '2026-11-07T12:03:00Z', ping: 13.9 },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data: updatedPingData });

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      const chartData = JSON.parse(
        getByTestId('chartjs-line').getAttribute('data-chart-data') || '{}'
      );
      expect(chartData.datasets[0].data).toEqual([14.2, 16.8, 15.1, 13.9]);
    });
  });

  it('handles API rejection gracefully without crashing', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network connection timeout'));

    const { getByText, container } = render(<PingWidget />);

    expect(getByText('Latencia siete')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });

    // Should gracefully remain in loading state
    expect(getByText('Latencia siete')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });
});
