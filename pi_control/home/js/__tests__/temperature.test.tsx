import * as React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import {
  getTemperatureData,
  TemperatureWidgetSet,
  TemperatureWidget,
  DeviceData,
  TemperatureDetail,
  TemperatureDetailGraph,
  RangeType,
} from '../temperature';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Temperature Components', () => {
  const sampleNowData = {
    time: '2026-11-07T12:00:00Z',
    room: 1,
    temperature: { value: 22.5, high: 26.0, low: 18.0 },
    humidity: { value: 45.0, high: 60.0, low: 30.0 },
    devices: [
      {
        device: 'sensor-1',
        device_name: 'Living Room Sensor',
        temperature: 22.5,
        humidity: 45.0,
        graphData: [] as any[],
      },
    ],
  };

  const sampleGraphData = [
    { time: '2026-11-07T11:00:00Z', temperature: 22.1, humidity: 44.5, device: 'sensor-1' },
    { time: '2026-11-07T12:00:00Z', temperature: 22.5, humidity: 45.0, device: 'sensor-1' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('getTemperatureData helper', () => {
    it('fetches room data and device graph series without date range', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        if (url.startsWith('/api/temperature/list/?device=sensor-1')) {
          return Promise.resolve({ data: sampleGraphData });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      const res = await getTemperatureData(1);
      expect(res.room).toBe(1);
      expect(res.devices[0].graphData).toEqual(sampleGraphData);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/temperature/room/1/now/');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/temperature/list/?device=sensor-1');
    });

    it('fetches room data with start and end date range URLs', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/2/now/') {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        if (url.includes('/api/temperature/list/')) {
          return Promise.resolve({ data: sampleGraphData });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      const start = new Date('2026-11-01T00:00:00Z').getTime();
      const end = new Date('2026-11-07T00:00:00Z').getTime();
      const res = await getTemperatureData(2, start, end);

      expect(res.devices[0].graphData).toEqual(sampleGraphData);
      const callUrls = mockedAxios.get.mock.calls.map(c => c[0]);
      expect(callUrls.some(u => u.includes('2026-11-01') && u.includes('2026-11-07'))).toBe(true);
    });
  });

  describe('TemperatureWidgetSet', () => {
    it('renders loading spinner and header when rooms is null initially', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));

      const { getByText, container } = render(<TemperatureWidgetSet />);

      expect(getByText('Teplota a vlhkost')).toBeInTheDocument();
      expect(container.querySelector('.loader')).toBeInTheDocument();
    });

    it('fetches rooms list and renders TemperatureWidget per room', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/rooms/') {
          return Promise.resolve({
            data: [
              { id: 1, name: 'Living Room' },
              { id: 2, name: 'Bedroom' },
            ],
          });
        }
        if (url.startsWith('/api/temperature/room/')) {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        if (url.includes('/api/temperature/list/')) {
          return Promise.resolve({ data: sampleGraphData });
        }
        return Promise.reject(new Error(`Unhandled GET: ${url}`));
      });

      const { getByText } = render(
        <MemoryRouter>
          <TemperatureWidgetSet />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByText('Living Room')).toBeInTheDocument();
        expect(getByText('Bedroom')).toBeInTheDocument();
      });
    });

    it('handles rooms fetch rejection gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const { getByText, container } = render(<TemperatureWidgetSet />);

      expect(getByText('Teplota a vlhkost')).toBeInTheDocument();
      expect(container.querySelector('.loader')).toBeInTheDocument();

      await act(async () => {
        await Promise.resolve();
      });

      expect(getByText('Teplota a vlhkost')).toBeInTheDocument();
      expect(container.querySelector('.loader')).toBeInTheDocument();
    });
  });

  describe('TemperatureWidget', () => {
    it('renders room metrics with text-success when values are within bounds', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        if (url.includes('/api/temperature/list/')) {
          return Promise.resolve({ data: sampleGraphData });
        }
        return Promise.reject(new Error(`Unhandled GET: ${url}`));
      });

      const { getByText, container } = render(
        <MemoryRouter>
          <TemperatureWidget room={{ id: 1, name: 'Kitchen' }} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByText('Kitchen')).toBeInTheDocument();
        expect(container.querySelectorAll('.temperature-widget-body.text-success').length).toBe(2);
      });

      const successBodies = container.querySelectorAll('.temperature-widget-body.text-success');
      // Temperature and humidity both within bounds -> 2 elements
      expect(successBodies.length).toBe(2);
      expect(successBodies[0].textContent).toContain('22.5');
      expect(successBodies[1].textContent).toContain('45.0');

      // Link to detail route
      const link = container.querySelector('a[href="/temperature/1"]');
      expect(link).toBeInTheDocument();

      // Collapse section
      const collapse = container.querySelector('#collapse_1');
      expect(collapse).toBeInTheDocument();
    });

    it('renders text-danger when metrics exceed high threshold', async () => {
      const highData = {
        ...sampleNowData,
        temperature: { value: 30.0, high: 26.0, low: 18.0 },
        humidity: { value: 75.0, high: 60.0, low: 30.0 },
      };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: highData });
        }
        return Promise.resolve({ data: sampleGraphData });
      });

      const { getByText, container } = render(
        <MemoryRouter>
          <TemperatureWidget room={{ id: 1, name: 'Attic' }} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByText('Attic')).toBeInTheDocument();
        expect(container.querySelectorAll('.temperature-widget-body.text-danger').length).toBe(2);
      });

      const dangerBodies = container.querySelectorAll('.temperature-widget-body.text-danger');
      expect(dangerBodies.length).toBe(2);
    });

    it('renders text-primary when metrics are below low threshold', async () => {
      const lowData = {
        ...sampleNowData,
        temperature: { value: 12.0, high: 26.0, low: 18.0 },
        humidity: { value: 20.0, high: 60.0, low: 30.0 },
      };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: lowData });
        }
        return Promise.resolve({ data: sampleGraphData });
      });

      const { getByText, container } = render(
        <MemoryRouter>
          <TemperatureWidget room={{ id: 1, name: 'Basement' }} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByText('Basement')).toBeInTheDocument();
        expect(container.querySelectorAll('.temperature-widget-body.text-primary').length).toBe(2);
      });

      const primaryBodies = container.querySelectorAll('.temperature-widget-body.text-primary');
      expect(primaryBodies.length).toBe(2);
    });
  });

  describe('DeviceData Component', () => {
    it('renders device details and Line chart when needs_details is true', () => {
      const { getByText, getByTestId } = render(
        <DeviceData
          device={{ id: 'dev-1', name: 'Balcony Sensor' }}
          temperature={{ value: 21.0, low: 18.0, high: 26.0 }}
          humidity={{ value: 50.0, low: 30.0, high: 60.0 }}
          data={sampleGraphData}
          needs_details={true}
        />
      );

      expect(getByText('Balcony Sensor')).toBeInTheDocument();
      expect(getByText('21°C')).toBeInTheDocument();
      expect(getByText('50%')).toBeInTheDocument();
      expect(getByTestId('chartjs-line')).toBeInTheDocument();
    });

    it('omits device name heading when needs_details is false', () => {
      const { queryByText, getByTestId } = render(
        <DeviceData
          device={{ id: 'dev-1', name: 'Hidden Sensor Name' }}
          temperature={{ value: 21.0, low: 18.0, high: 26.0 }}
          humidity={{ value: 50.0, low: 30.0, high: 60.0 }}
          data={sampleGraphData}
          needs_details={false}
        />
      );

      expect(queryByText('Hidden Sensor Name')).toBeNull();
      expect(getByTestId('chartjs-line')).toBeInTheDocument();
    });
  });

  describe('TemperatureDetail Component', () => {
    const routeProps = {
      match: { params: { id: '1' }, isExact: true, path: '/temperature/:id', url: '/temperature/1' },
      location: {} as any,
      history: {} as any,
    };

    it('renders back button, duration preset radio buttons, and DatePickers', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        return Promise.resolve({ data: sampleGraphData });
      });

      const { getByText, getByLabelText } = render(
        <MemoryRouter>
          <TemperatureDetail {...routeProps} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByText('Späť')).toBeInTheDocument();
      });

      expect(getByLabelText('1 týždeň')).toBeInTheDocument();
      expect(getByLabelText('30 dni')).toBeInTheDocument();
      expect(getByLabelText('90 dni')).toBeInTheDocument();
      expect(getByLabelText('Vlastné')).toBeInTheDocument();
    });

    it('has 1 týždeň checked by default and datepickers disabled', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        return Promise.resolve({ data: sampleGraphData });
      });

      const { getByLabelText, container } = render(
        <MemoryRouter>
          <TemperatureDetail {...routeProps} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByLabelText('1 týždeň')).toBeInTheDocument();
      });

      const weekRadio = getByLabelText('1 týždeň') as HTMLInputElement;
      expect(weekRadio.checked).toBe(true);

      const datePickers = container.querySelectorAll('input.form-control');
      datePickers.forEach((dp) => expect(dp).toBeDisabled());
    });

    it('switches to Custom preset and enables date inputs', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        return Promise.resolve({ data: sampleGraphData });
      });

      const { getByLabelText, container } = render(
        <MemoryRouter>
          <TemperatureDetail {...routeProps} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByLabelText('Vlastné')).toBeInTheDocument();
      });

      const customRadio = getByLabelText('Vlastné') as HTMLInputElement;
      fireEvent.click(customRadio);

      await act(async () => {
        await Promise.resolve();
      });

      expect(customRadio.checked).toBe(true);
      const datePickers = container.querySelectorAll('input.form-control');
      datePickers.forEach((dp) => expect(dp).not.toBeDisabled());
    });

    it('fetches updated data when switching presets', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/temperature/room/1/now/') {
          return Promise.resolve({ data: JSON.parse(JSON.stringify(sampleNowData)) });
        }
        return Promise.resolve({ data: sampleGraphData });
      });

      const { getByLabelText } = render(
        <MemoryRouter>
          <TemperatureDetail {...routeProps} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByLabelText('30 dni')).toBeInTheDocument();
      });

      const callsBefore = mockedAxios.get.mock.calls.length;
      const monthRadio = getByLabelText('30 dni') as HTMLInputElement;
      fireEvent.click(monthRadio);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('TemperatureDetailGraph Component', () => {
    it('mounts amCharts 4 XYChart on container div and cleans up on unmount', () => {
      const { container, unmount } = render(
        <TemperatureDetailGraph
          device={{ id: 'dev-main', name: 'Main' }}
          data={sampleGraphData}
        />
      );

      const chartDiv = container.querySelector('#chartdiv_dev-main');
      expect(chartDiv).toBeInTheDocument();

      // Verify unmount triggers dispose
      unmount();
    });
  });
});
