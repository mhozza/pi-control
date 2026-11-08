import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import axios from 'axios';
import { App, Widgets } from '../app';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('App and Router Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/temperature/rooms/') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Living Room' }],
        });
      }
      if (url.startsWith('/api/temperature/room/1/now/')) {
        return Promise.resolve({
          data: {
            time: '2026-11-07T12:00:00Z',
            room: 1,
            temperature: { value: 21.5, high: 26.0, low: 18.0 },
            humidity: { value: 45.0, high: 60.0, low: 30.0 },
            devices: [],
          },
        });
      }
      if (url.startsWith('/api/temperature/room/42/now/')) {
        return Promise.resolve({
          data: {
            time: '2026-11-07T12:00:00Z',
            room: 42,
            temperature: { value: 23.0, high: 26.0, low: 18.0 },
            humidity: { value: 48.0, high: 60.0, low: 30.0 },
            devices: [],
          },
        });
      }
      if (url === '/api/pc_status/list') {
        return Promise.resolve({ data: ['office-pc'] });
      }
      if (url.startsWith('/api/pc_status/status/')) {
        return Promise.resolve({
          data: {
            name: 'office-pc',
            online: true,
            ssh: true,
            time: '2026-11-07T12:00:00Z',
          },
        });
      }
      if (url === '/api/server_stats') {
        return Promise.resolve({
          data: {
            name: 'pi-controller',
            time: '2026-11-07T12:00:00Z',
            cpu: 15.0,
            memory: 35.0,
            swap: 5.0,
            cpu_temp: 42.0,
            uptime: '10 days',
          },
        });
      }
      if (url === '/api/network/list' || url.startsWith('/api/network/list/')) {
        return Promise.resolve({
          data: [{ time: '2026-11-07T12:00:00Z', ping: 12.5 }],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  describe('Widgets Component', () => {
    it('renders responsive grid container row row-cols-1 row-cols-md-2 row-cols-lg-3', () => {
      const { container } = render(
        <MemoryRouter>
          <Widgets />
        </MemoryRouter>
      );

      const grid = container.querySelector(
        '.row.row-cols-1.row-cols-md-2.row-cols-lg-3'
      );
      expect(grid).toBeInTheDocument();
    });

    it('mounts all four widget suites simultaneously', async () => {
      const { getByText } = render(
        <MemoryRouter>
          <Widgets />
        </MemoryRouter>
      );

      // Network header
      expect(getByText('Latencia siete')).toBeInTheDocument();

      // Check loaded widgets after async resolve
      await waitFor(() => {
        expect(getByText('Living Room')).toBeInTheDocument(); // TemperatureWidgetSet
        expect(getByText('office-pc')).toBeInTheDocument(); // PcStatusWidgetSet
        expect(getByText('pi-controller')).toBeInTheDocument(); // ServerStatsWidget
      });
    });
  });

  describe('App Routing Navigation', () => {
    it('renders Widgets view on root route ("/")', async () => {
      const { getByText, queryByText } = render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      expect(getByText('Latencia siete')).toBeInTheDocument();

      await waitFor(() => {
        expect(getByText('pi-controller')).toBeInTheDocument();
      });

      // Does not render TemperatureDetail navigation back button
      expect(queryByText('Späť')).toBeNull();
    });

    it('renders TemperatureDetail view on route ("/temperature/:id")', async () => {
      const { getByText, queryByText } = render(
        <MemoryRouter initialEntries={['/temperature/42']}>
          <App />
        </MemoryRouter>
      );

      // Detail navbar contains back button "Späť" and preset durations
      await waitFor(() => {
        expect(getByText('Späť')).toBeInTheDocument();
      });

      expect(getByText('1 týždeň')).toBeInTheDocument();
      expect(getByText('30 dni')).toBeInTheDocument();

      // Does not render dashboard ping chart
      expect(queryByText('Latencia siete')).toBeNull();
    });

    it('renders NetworkDetail view on route ("/network")', async () => {
      const { getByText, queryByText } = render(
        <MemoryRouter initialEntries={['/network']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByText('Späť')).toBeInTheDocument();
        expect(getByText('Latencia siete (ms)')).toBeInTheDocument();
      });

      expect(getByText('1 týždeň')).toBeInTheDocument();
      expect(queryByText('pi-controller')).toBeNull();
    });
  });

  describe('Root DOM Mount', () => {
    it('mounts App into root container without error', () => {
      const rootDiv = document.getElementById('root');
      expect(rootDiv).not.toBeNull();
      if (rootDiv) {
        render(
          <MemoryRouter>
            <App />
          </MemoryRouter>,
          { container: rootDiv }
        );
        expect(rootDiv.querySelector('main')).toBeInTheDocument();
      }
    });
  });
});
