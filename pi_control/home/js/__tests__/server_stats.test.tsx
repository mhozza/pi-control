import * as React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import { ServerStatsWidget } from '../server_stats';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ServerStatsWidget Component', () => {
  const sampleLowStats = {
    name: 'raspberrypi-main',
    time: '2026-11-07T12:00:00Z',
    cpu: 25.5,
    memory: 40.0,
    swap: 10.2,
    cpu_temp: 45.0,
    uptime: '14 days, 3 hours',
  };

  const sampleHighStats = {
    name: 'raspberrypi-main',
    time: '2026-11-07T12:00:00Z',
    cpu: 75.2,
    memory: 85.0,
    swap: 62.4,
    cpu_temp: 85.5,
    uptime: '14 days, 3 hours',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders loading spinner and Server header initially before API responds', () => {
    // Return pending promise
    mockedAxios.get.mockReturnValue(new Promise(() => {}));

    const { getByText, container } = render(<ServerStatsWidget />);

    expect(getByText('Server')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });

  it('renders all server metrics with text-success styling under low load', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleLowStats });

    const { getByText, container } = render(<ServerStatsWidget />);

    await waitFor(() => {
      expect(getByText('raspberrypi-main')).toBeInTheDocument();
    });

    // Check CPU metric
    expect(getByText('CPU')).toBeInTheDocument();
    const cpuVal = container.querySelector('.serverstats-controls.text-success');
    expect(cpuVal).toBeInTheDocument();
    expect(cpuVal?.textContent).toContain('25.5');

    // Check RAM & SWAP
    expect(getByText('RAM')).toBeInTheDocument();
    expect(getByText('SWAP')).toBeInTheDocument();

    // Check CPU temperature
    expect(getByText('Teplota CPU:')).toBeInTheDocument();
    const tempVal = container.querySelector('span.text-success');
    expect(tempVal?.textContent).toContain('45°C');

    // Check uptime and footer date
    expect(getByText('Čas od zapnutia:')).toBeInTheDocument();
    expect(getByText('14 days, 3 hours')).toBeInTheDocument();
    expect(container.querySelector('.card-footer')).toHaveTextContent(
      new Date('2026-11-07T12:00:00Z').toLocaleString()
    );
  });

  it('renders metrics with text-danger styling under high load (>50% load, >80°C temp)', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleHighStats });

    const { getByText, container } = render(<ServerStatsWidget />);

    await waitFor(() => {
      expect(getByText('raspberrypi-main')).toBeInTheDocument();
    });

    const dangerControls = container.querySelectorAll('.serverstats-controls.text-danger');
    // CPU, RAM, SWAP all > 50 -> 3 danger elements
    expect(dangerControls.length).toBe(3);

    const tempDanger = container.querySelector('span.text-danger');
    expect(tempDanger).toBeInTheDocument();
    expect(tempDanger?.textContent).toContain('85.5°C');
  });

  it('omits CPU temperature element when cpu_temp is null', async () => {
    const statsWithoutTemp = {
      ...sampleLowStats,
      cpu_temp: null as any,
    };
    mockedAxios.get.mockResolvedValueOnce({ data: statsWithoutTemp });

    const { getByText, queryByText } = render(<ServerStatsWidget />);

    await waitFor(() => {
      expect(getByText('raspberrypi-main')).toBeInTheDocument();
    });

    expect(queryByText('Teplota CPU:')).toBeNull();
    expect(getByText('14 days, 3 hours')).toBeInTheDocument();
  });

  it('periodically refreshes stats on 15-second intervals', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleLowStats });

    const { getByText } = render(<ServerStatsWidget />);

    await waitFor(() => {
      expect(getByText('raspberrypi-main')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/server_stats');

    // Mock next response for interval
    const updatedStats = {
      ...sampleLowStats,
      cpu: 99.0,
      uptime: '14 days, 4 hours',
    };
    mockedAxios.get.mockResolvedValueOnce({ data: updatedStats });

    // Advance timers by 15s
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(getByText('14 days, 4 hours')).toBeInTheDocument();
    });
  });

  it('handles API rejection gracefully without crashing', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error 500'));

    const { getByText, container } = render(<ServerStatsWidget />);

    // Should remain in loading state and not throw
    expect(getByText('Server')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByText('Server')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });
});
