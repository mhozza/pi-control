import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
    TimeSeriesChart,
    DetailRangeNav,
    RangeType,
    computeSeriesStats,
    computeRangeBounds,
    resolveRangeType,
} from '../chart';

describe('Unified Chart Components', () => {
    const sampleLabels = ['2026-11-07T10:00:00Z', '2026-11-07T11:00:00Z', '2026-11-07T12:00:00Z'];

    describe('computeSeriesStats', () => {
        it('returns min, max, avg, and latest for valid numeric values', () => {
            const stats = computeSeriesStats([10, 20, 30]);
            expect(stats).toEqual({
                min: 10,
                max: 30,
                avg: 20,
                latest: 30,
            });
        });

        it('returns null for empty or null-only arrays', () => {
            expect(computeSeriesStats([])).toBeNull();
            expect(computeSeriesStats([null, undefined])).toBeNull();
        });
    });

    describe('TimeSeriesChart', () => {
        it('renders compact preview chart without legend or summary stats', () => {
            const { getByTestId, queryByTestId } = render(
                <TimeSeriesChart
                    variant="preview"
                    labels={sampleLabels}
                    series={[
                        {
                            label: 'Ping latencia',
                            data: [12, 15, 14],
                            borderColor: 'rgba(128, 128, 128, .8)',
                            pointRadius: 3,
                        },
                    ]}
                    axes={[
                        {
                            id: 'y',
                            title: 'Ping (ms)',
                            position: 'left',
                            beginAtZero: true,
                            suggestedMax: 50,
                        },
                    ]}
                />
            );

            const line = getByTestId('chartjs-line');
            expect(line).toHaveClass('card-img-bottom');
            expect(queryByTestId('chart-summary-stats')).toBeNull();

            const options = JSON.parse(line.getAttribute('data-chart-options') || '{}');
            expect(options.plugins.legend.display).toBe(false);
            expect(options.scales.y.title.text).toBe('Ping (ms)');
        });

        it('renders interactive detail chart with zoom config, summary stats, and reset button', () => {
            const { getByTestId, getByText, container } = render(
                <TimeSeriesChart
                    variant="detail"
                    title="Obývačka"
                    containerId="chartdiv_sensor-1"
                    labels={sampleLabels}
                    series={[
                        {
                            label: 'Teplota (°C)',
                            unit: '°C',
                            data: [20.0, 24.0, 22.0],
                            borderColor: 'rgba(220, 53, 69, .8)',
                            yAxisID: 'y1',
                        },
                    ]}
                    axes={[
                        {
                            id: 'y1',
                            title: 'Teplota (°C)',
                            position: 'left',
                        },
                    ]}
                />
            );

            expect(container.querySelector('#chartdiv_sensor-1')).toBeInTheDocument();
            expect(getByText('Obývačka')).toBeInTheDocument();
            expect(getByTestId('chart-summary-stats')).toBeInTheDocument();
            expect(getByText('24.0°C')).toBeInTheDocument();
            expect(getByText('20.0°C')).toBeInTheDocument();

            const line = getByTestId('chartjs-line');
            const options = JSON.parse(line.getAttribute('data-chart-options') || '{}');
            expect(options.plugins.legend.display).toBe(true);
            expect(options.plugins.zoom.zoom.wheel.enabled).toBe(true);
            expect(options.plugins.zoom.zoom.drag.enabled).toBe(true);

            const resetBtn = getByTestId('reset-zoom-btn');
            fireEvent.click(resetBtn);
        });
    });

    describe('DetailRangeNav and range helpers', () => {
        it('computes range bounds and resolves preset types', () => {
            const d1 = new Date('2026-11-01T10:00:00Z');
            const d2 = new Date('2026-11-05T10:00:00Z');
            const weekBounds = computeRangeBounds(RangeType.LastWeek, d1, d2);
            expect(weekBounds.isCustom).toBe(false);
            expect(resolveRangeType(weekBounds.start, weekBounds.end, false)).toBe(RangeType.LastWeek);

            const dayBounds = computeRangeBounds(RangeType.Last24Hours, d1, d2);
            expect(resolveRangeType(dayBounds.start, dayBounds.end, false)).toBe(RangeType.Last24Hours);

            const customBounds = computeRangeBounds(RangeType.Custom, d1, d2);
            expect(customBounds.isCustom).toBe(true);
            expect(resolveRangeType(customBounds.start, customBounds.end, true)).toBe(RangeType.Custom);
        });

        it('triggers callbacks when selecting presets and changing custom dates', () => {
            const onSelectPreset = jest.fn();
            const onChangeStart = jest.fn();
            const onChangeEnd = jest.fn();

            const { getByLabelText } = render(
                <MemoryRouter>
                    <DetailRangeNav
                        title="História"
                        start={new Date('2026-11-01T00:00:00').getTime()}
                        end={new Date('2026-11-07T23:59:59').getTime()}
                        rangeType={RangeType.Custom}
                        onSelectPreset={onSelectPreset}
                        onChangeStart={onChangeStart}
                        onChangeEnd={onChangeEnd}
                    />
                </MemoryRouter>
            );

            fireEvent.click(getByLabelText('30 dni'));
            expect(onSelectPreset).toHaveBeenCalledWith(RangeType.Last30Days);

            fireEvent.change(getByLabelText('Od'), { target: { value: '2026-10-15' } });
            expect(onChangeStart).toHaveBeenCalled();

            fireEvent.change(getByLabelText('Do'), { target: { value: '2026-10-20' } });
            expect(onChangeEnd).toHaveBeenCalled();
        });

        it('renders mobile time span toggler button and collapsible controls with appropriate navbar theme', () => {
            const { container, getByLabelText } = render(
                <MemoryRouter>
                    <DetailRangeNav
                        title="História"
                        start={new Date('2026-11-01T00:00:00').getTime()}
                        end={new Date('2026-11-07T23:59:59').getTime()}
                        rangeType={RangeType.LastWeek}
                        onSelectPreset={jest.fn()}
                        onChangeStart={jest.fn()}
                        onChangeEnd={jest.fn()}
                    />
                </MemoryRouter>
            );

            const toggler = getByLabelText('Toggle navigation');
            expect(toggler).toBeInTheDocument();
            expect(toggler).toHaveClass('navbar-toggler');
            expect(toggler).toHaveAttribute('data-bs-toggle', 'collapse');
            expect(toggler).toHaveAttribute('data-bs-target', '#detailNavbarControls');
            expect(toggler.querySelector('.navbar-toggler-icon')).toBeInTheDocument();

            const collapse = container.querySelector('#detailNavbarControls');
            expect(collapse).toBeInTheDocument();
            expect(collapse).toHaveClass('collapse', 'navbar-collapse');

            const nav = container.querySelector('nav.detail-toolbar');
            expect(nav).toBeInTheDocument();
            expect(nav).toHaveClass('navbar');
            expect(nav?.classList.contains('navbar-light') || nav?.classList.contains('navbar-dark')).toBe(true);
        });
    });
});
