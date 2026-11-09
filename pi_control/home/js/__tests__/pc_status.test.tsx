import * as React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import axios from 'axios';
import * as cookie from 'cookie';
import { PcStatusWidgetSet, PcStatusWidget } from '../pc_status';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PcStatus Widgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Default post headers dictionary
    if (!mockedAxios.defaults) {
      (mockedAxios as any).defaults = { headers: { post: {} } };
    } else if (!mockedAxios.defaults.headers) {
      (mockedAxios.defaults as any).headers = { post: {} };
    } else if (!mockedAxios.defaults.headers.post) {
      mockedAxios.defaults.headers.post = {};
    }
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('CSRF Token Initialization', () => {
    it('sets xsrf defaults for dynamic cookie parsing', () => {
      expect(axios.defaults.xsrfCookieName).toBe('csrftoken');
      expect(axios.defaults.xsrfHeaderName).toBe('X-CSRFToken');
    });
  });

  describe('PcStatusWidgetSet', () => {
    it('renders loading spinner and PC header when pcs is null initially', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));

      const { getByText, container } = render(<PcStatusWidgetSet />);

      expect(getByText('PC')).toBeInTheDocument();
      expect(container.querySelector('.loader')).toBeInTheDocument();
    });

    it('fetches PC list and renders PcStatusWidget children for each PC', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url === '/api/pc_status/list') {
          return Promise.resolve({ data: ['desktop-pc', 'nas-server'] });
        }
        if (url === '/api/pc_status/status/desktop-pc') {
          return Promise.resolve({
            data: {
              name: 'desktop-pc',
              online: true,
              ssh: true,
              time: '2026-11-07T12:00:00Z',
            },
          });
        }
        if (url === '/api/pc_status/status/nas-server') {
          return Promise.resolve({
            data: {
              name: 'nas-server',
              online: false,
              ssh: false,
              time: '2026-11-07T12:00:00Z',
            },
          });
        }
        return Promise.reject(new Error(`Unhandled GET url: ${url}`));
      });

      const { getByText } = render(<PcStatusWidgetSet />);

      await waitFor(() => {
        expect(getByText('desktop-pc')).toBeInTheDocument();
        expect(getByText('nas-server')).toBeInTheDocument();
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/pc_status/list');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/pc_status/status/desktop-pc');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/pc_status/status/nas-server');
    });

    it('handles PC list fetch rejection gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('500 Internal Error'));

      const { getByText, container } = render(<PcStatusWidgetSet />);

      expect(getByText('PC')).toBeInTheDocument();
      expect(container.querySelector('.loader')).toBeInTheDocument();

      await act(async () => {
        await Promise.resolve();
      });

      expect(getByText('PC')).toBeInTheDocument();
      expect(container.querySelector('.loader')).toBeInTheDocument();
    });
  });

  describe('PcStatusWidget', () => {
    const onlinePcData = {
      name: 'workstation',
      online: true,
      ssh: true,
      time: '2026-11-07T14:30:00Z',
    };

    const offlinePcData = {
      name: 'gaming-rig',
      online: false,
      ssh: false,
      time: '2026-11-07T14:30:00Z',
    };

    it('renders loading spinner initially before PC status resolves', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));

      const { getByText, container } = render(<PcStatusWidget pc="workstation" />);

      expect(getByText('PC')).toBeInTheDocument();
      expect(container.querySelector('.loader')).toBeInTheDocument();
    });

    it('renders online PC with green badge, SSH status, and Uspi sleep button', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: onlinePcData });

      const { getByText, container } = render(<PcStatusWidget pc="workstation" />);

      await waitFor(() => {
        expect(getByText('workstation')).toBeInTheDocument();
      });

      // Primary status badge
      const statusBadge = container.querySelector('.pc_status-widget-primary');
      expect(statusBadge).toHaveClass('text-success');
      expect(statusBadge).toHaveTextContent('online');

      // SSH status badge
      const sshBadge = container.querySelector('.pc_status-widget-secondary span.text-success');
      expect(sshBadge).toBeInTheDocument();
      expect(sshBadge).toHaveTextContent('online');

      // Action button
      const sleepBtn = getByText('Uspi');
      expect(sleepBtn).toBeInTheDocument();
      expect(sleepBtn.tagName).toBe('BUTTON');

      // Footer
      expect(container.querySelector('.card-footer')).toHaveTextContent(
        new Date('2026-11-07T14:30:00Z').toLocaleString()
      );
    });

    it('renders offline PC with red badge, offline SSH, and Zapni wake button', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: offlinePcData });

      const { getByText, container } = render(<PcStatusWidget pc="gaming-rig" />);

      await waitFor(() => {
        expect(getByText('gaming-rig')).toBeInTheDocument();
      });

      const statusBadge = container.querySelector('.pc_status-widget-primary');
      expect(statusBadge).toHaveClass('text-danger');
      expect(statusBadge).toHaveTextContent('offline');

      const sshBadge = container.querySelector('.pc_status-widget-secondary span.text-danger');
      expect(sshBadge).toBeInTheDocument();
      expect(sshBadge).toHaveTextContent('offline');

      const wakeBtn = getByText('Zapni');
      expect(wakeBtn).toBeInTheDocument();
    });

    it('triggers sleep API and transitions to loading spinner button on sleep click', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: onlinePcData });
      mockedAxios.post.mockResolvedValueOnce({ data: { status: 'ok' } });

      const { getByText, container } = render(<PcStatusWidget pc="workstation" />);

      await waitFor(() => {
        expect(getByText('workstation')).toBeInTheDocument();
      });

      const sleepBtn = getByText('Uspi');
      fireEvent.click(sleepBtn);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/pc_status/sleep/workstation');

      await waitFor(() => {
        expect(getByText('Uspávam...')).toBeInTheDocument();
      });

      expect(container.querySelector('.spinner-border')).toBeInTheDocument();
    });

    it('triggers wakeup API and transitions to loading spinner button on wakeup click', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: offlinePcData });
      mockedAxios.post.mockResolvedValueOnce({ data: { status: 'ok' } });

      const { getByText, container } = render(<PcStatusWidget pc="gaming-rig" />);

      await waitFor(() => {
        expect(getByText('gaming-rig')).toBeInTheDocument();
      });

      const wakeBtn = getByText('Zapni');
      fireEvent.click(wakeBtn);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/pc_status/wakeup/gaming-rig');

      await waitFor(() => {
        expect(getByText('Zapnínam...')).toBeInTheDocument();
      });

      expect(container.querySelector('.spinner-border')).toBeInTheDocument();
    });

    it('periodically refreshes PC status on 15s interval', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: onlinePcData });

      const { getByText, container } = render(<PcStatusWidget pc="workstation" />);

      await waitFor(() => {
        expect(getByText('workstation')).toBeInTheDocument();
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Now PC went offline
      mockedAxios.get.mockResolvedValueOnce({
        data: { ...onlinePcData, online: false, ssh: false },
      });

      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        const badge = container.querySelector('.pc_status-widget-primary');
        expect(badge).toHaveClass('text-danger');
        expect(badge).toHaveTextContent('offline');
      });
    });

    it('handles post action rejection gracefully without crashing', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: onlinePcData });
      mockedAxios.post.mockRejectedValueOnce(new Error('Network failure'));

      const { getByText } = render(<PcStatusWidget pc="workstation" />);

      await waitFor(() => {
        expect(getByText('workstation')).toBeInTheDocument();
      });

      const sleepBtn = getByText('Uspi');
      fireEvent.click(sleepBtn);

      await act(async () => {
        await Promise.resolve();
      });

      // Still renders without crashing
      expect(getByText('workstation')).toBeInTheDocument();
    });
  });
});
