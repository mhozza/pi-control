import * as React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import { Widget } from '../widget';

// Concrete subclass for testing base Widget functionality
interface TestWidgetProps {
  title?: string;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

interface TestWidgetState {
  tickCount: number;
  error: string | null;
}

class TestWidget extends Widget<TestWidgetProps, TestWidgetState> {
  state: TestWidgetState = {
    tickCount: 0,
    error: null,
  };

  tick() {
    this.setState((prev) => ({ tickCount: prev.tickCount + 1 }));
  }

  handleManualRefresh = () => {
    this.tick();
    if (this.props.onRefresh) {
      this.props.onRefresh();
    }
  };

  simulateError = (msg: string) => {
    this.setState({ error: msg });
  };

  render() {
    return (
      <div className="card test-widget">
        <div className="card-header">
          <span data-testid="widget-title">{this.props.title || 'Default Title'}</span>
          <button data-testid="refresh-btn" onClick={this.handleManualRefresh}>
            Refresh
          </button>
        </div>
        <div className="card-body">
          {this.state.error ? (
            <div data-testid="error-alert" className="alert alert-danger">
              {this.state.error}
            </div>
          ) : (
            <div data-testid="widget-content">
              <span data-testid="tick-count">{this.state.tickCount}</span>
              {this.props.children}
            </div>
          )}
        </div>
      </div>
    );
  }
}

describe('Widget Base Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders default Widget base class subclass without error', () => {
    class MinimalWidget extends Widget {
      render() {
        return <div data-testid="minimal-widget" />;
      }
    }
    const { getByTestId } = render(<MinimalWidget />);
    expect(getByTestId('minimal-widget')).toBeInTheDocument();
  });

  it('calls tick() immediately upon mounting', () => {
    const { getByTestId } = render(<TestWidget title="System Monitor" />);
    // Initial mount calls tick once
    expect(getByTestId('tick-count')).toHaveTextContent('1');
  });

  it('sets up 15-second polling interval and calls tick() on each interval', () => {
    const { getByTestId } = render(<TestWidget />);
    expect(getByTestId('tick-count')).toHaveTextContent('1');

    // Advance 15 seconds
    act(() => {
      jest.advanceTimersByTime(15000);
    });
    expect(getByTestId('tick-count')).toHaveTextContent('2');

    // Advance another 15 seconds
    act(() => {
      jest.advanceTimersByTime(15000);
    });
    expect(getByTestId('tick-count')).toHaveTextContent('3');

    // Advance 30 more seconds (2 intervals)
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(getByTestId('tick-count')).toHaveTextContent('5');
  });

  it('clears polling interval on unmount (componentWillUnmount)', () => {
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    const { getByTestId, unmount } = render(<TestWidget />);

    expect(getByTestId('tick-count')).toHaveTextContent('1');

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();

    // Advancing timers after unmount should not throw or cause state updates
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    clearIntervalSpy.mockRestore();
  });

  it('renders child content, title, and handles manual refresh button', () => {
    const onRefreshMock = jest.fn();
    const { getByTestId } = render(
      <TestWidget title="Custom Sensor" onRefresh={onRefreshMock}>
        <span data-testid="child-element">Sensor OK</span>
      </TestWidget>
    );

    expect(getByTestId('widget-title')).toHaveTextContent('Custom Sensor');
    expect(getByTestId('child-element')).toHaveTextContent('Sensor OK');
    expect(getByTestId('tick-count')).toHaveTextContent('1');

    // Click refresh button
    fireEvent.click(getByTestId('refresh-btn'));
    expect(onRefreshMock).toHaveBeenCalledTimes(1);
    expect(getByTestId('tick-count')).toHaveTextContent('2');
  });

  it('displays error state when error is present', () => {
    let widgetInstance: TestWidget | null = null;
    const { getByTestId, queryByTestId } = render(
      <TestWidget ref={(ref) => (widgetInstance = ref)} />
    );

    expect(queryByTestId('error-alert')).toBeNull();
    expect(getByTestId('widget-content')).toBeInTheDocument();

    act(() => {
      widgetInstance?.simulateError('Failed to fetch sensor metrics');
    });

    expect(getByTestId('error-alert')).toBeInTheDocument();
    expect(getByTestId('error-alert')).toHaveTextContent('Failed to fetch sensor metrics');
    expect(queryByTestId('widget-content')).toBeNull();
  });
});
