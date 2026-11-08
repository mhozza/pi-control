import * as React from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
    Chart,
    ChartData,
    ChartOptions,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Link } from 'react-router-dom';

if (typeof Chart?.register === 'function') {
    Chart.register(
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        TimeScale,
        Tooltip,
        Legend,
        Filler,
        zoomPlugin
    );
}

export const DISPLAY_FORMATS = {
    hour: 'HH:mm',
    minute: 'HH:mm',
    second: 'HH:mm:ss',
    day: 'dd.MM.',
    month: 'MM/yyyy',
};

export const HOUR = 3600000;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
export const THIRTY_DAYS = DAY * 30;
export const NINETY_DAYS = DAY * 90;

export enum RangeType {
    Custom = 0,
    LastWeek = 1,
    Last30Days = 2,
    Last90Days = 3,
    Last24Hours = 4,
}

export function equalInDays(timeStamp1: number, timestamp2: number): boolean {
    return Math.trunc(timeStamp1 / DAY) === Math.trunc(timestamp2 / DAY);
}

export function formatDateInput(timestamp: number): string {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export interface SeriesStats {
    min: number;
    max: number;
    avg: number;
    latest: number;
}

export function computeSeriesStats(values: (number | null | undefined)[]): SeriesStats | null {
    const valid = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    if (valid.length === 0) {
        return null;
    }
    let min = valid[0];
    let max = valid[0];
    let sum = 0;
    for (const v of valid) {
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
    }
    return {
        min,
        max,
        avg: sum / valid.length,
        latest: valid[valid.length - 1],
    };
}

export interface TimeSeriesDefinition {
    label: string;
    unit?: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor?: string;
    yAxisID?: string;
    pointRadius?: number;
    fill?: boolean;
}

export interface TimeSeriesAxisConfig {
    id: string;
    title: string;
    position: 'left' | 'right';
    beginAtZero?: boolean;
    suggestedMin?: number;
    suggestedMax?: number;
    drawOnChartArea?: boolean;
}

export interface TimeSeriesChartProps {
    labels: string[];
    series: TimeSeriesDefinition[];
    axes: TimeSeriesAxisConfig[];
    variant?: 'preview' | 'detail';
    tooltipFormat?: string;
    title?: string;
    containerId?: string;
    className?: string;
}

export function TimeSeriesChart(props: TimeSeriesChartProps) {
    const {
        labels,
        series,
        axes,
        variant = 'preview',
        tooltipFormat = variant === 'detail' ? 'dd.MM.yyyy HH:mm' : 'HH:mm',
        title,
        containerId,
        className,
    } = props;

    const chartRef = React.useRef<any>(null);
    const [isZoomed, setIsZoomed] = React.useState(false);

    const handleResetZoom = () => {
        if (chartRef.current && typeof chartRef.current.resetZoom === 'function') {
            chartRef.current.resetZoom();
        }
        setIsZoomed(false);
    };

    const isDetail = variant === 'detail';

    const chartData: ChartData<'line'> = {
        labels,
        datasets: series.map((s) => ({
            label: s.label,
            data: s.data,
            borderColor: s.borderColor,
            ...(s.backgroundColor ? { backgroundColor: s.backgroundColor } : {}),
            pointRadius: s.pointRadius !== undefined ? s.pointRadius : 0,
            ...(isDetail ? { pointHoverRadius: 4, borderWidth: 2 } : {}),
            fill: s.fill ?? false,
            ...(s.yAxisID ? { yAxisID: s.yAxisID } : {}),
            cubicInterpolationMode: 'monotone' as const,
        })),
    };

    const scales: Record<string, any> = {
        x: {
            type: 'time',
            time: {
                tooltipFormat,
                displayFormats: DISPLAY_FORMATS,
            },
            ticks: {
                source: 'data',
                autoSkip: true,
                ...(isDetail ? { maxTicksLimit: 12 } : {}),
            },
            title: {
                display: false,
            },
        },
    };

    for (const axis of axes) {
        scales[axis.id] = {
            type: 'linear',
            display: true,
            position: axis.position,
            title: {
                display: true,
                text: axis.title,
            },
            ...(axis.beginAtZero !== undefined ? { beginAtZero: axis.beginAtZero } : {}),
            ...(axis.suggestedMin !== undefined ? { suggestedMin: axis.suggestedMin } : {}),
            ...(axis.suggestedMax !== undefined ? { suggestedMax: axis.suggestedMax } : {}),
            ...(axis.drawOnChartArea !== undefined
                ? { grid: { drawOnChartArea: axis.drawOnChartArea } }
                : {}),
        };
    }

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        ...(isDetail
            ? {
                  maintainAspectRatio: false,
                  interaction: {
                      mode: 'index',
                      intersect: false,
                  },
              }
            : {}),
        plugins: {
            legend: {
                display: isDetail,
            },
            ...(isDetail
                ? {
                      zoom: {
                          pan: {
                              enabled: true,
                              mode: 'x',
                              modifierKey: 'shift',
                              onPanComplete: () => setIsZoomed(true),
                          },
                          zoom: {
                              wheel: {
                                  enabled: true,
                              },
                              pinch: {
                                  enabled: true,
                              },
                              drag: {
                                  enabled: true,
                                  backgroundColor: 'rgba(13, 110, 253, 0.12)',
                                  borderColor: 'rgba(13, 110, 253, 0.5)',
                                  borderWidth: 1,
                              },
                              mode: 'x',
                              onZoomComplete: () => setIsZoomed(true),
                          },
                      },
                  }
                : {}),
        },
        scales,
    };

    if (!isDetail) {
        return (
            <Line
                ref={chartRef}
                className={className ?? 'card-img-bottom'}
                data={chartData}
                options={chartOptions}
                width={150}
                height={100}
            />
        );
    }

    return (
        <div className="card detail-chart-card mb-3" id={containerId}>
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="fw-semibold">{title}</div>
                <div className="d-flex align-items-center gap-2">
                    <small className="text-muted d-none d-sm-inline">
                        Potiahnutím myšou alebo kolieskom priblížite úsek
                    </small>
                    <button
                        type="button"
                        data-testid="reset-zoom-btn"
                        className={`btn btn-sm ${isZoomed ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                        onClick={handleResetZoom}
                    >
                        Resetovať priblíženie
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row g-2 mb-3" data-testid="chart-summary-stats">
                    {series.map((s, idx) => {
                        const stats = computeSeriesStats(s.data);
                        if (!stats) return null;
                        const unit = s.unit ?? '';
                        return (
                            <div className="col-12 col-md-6" key={idx}>
                                <div className="p-2 rounded border detail-stat-box d-flex justify-content-around text-center">
                                    <div>
                                        <div className="small text-muted">{s.label} (aktuálne)</div>
                                        <div className="fw-bold">{stats.latest.toFixed(1)}{unit}</div>
                                    </div>
                                    <div>
                                        <div className="small text-muted">Priemer</div>
                                        <div className="fw-semibold">{stats.avg.toFixed(1)}{unit}</div>
                                    </div>
                                    <div>
                                        <div className="small text-muted">Min</div>
                                        <div className="fw-semibold text-primary">{stats.min.toFixed(1)}{unit}</div>
                                    </div>
                                    <div>
                                        <div className="small text-muted">Max</div>
                                        <div className="fw-semibold text-danger">{stats.max.toFixed(1)}{unit}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="detail-chart-canvas-wrapper" style={{ width: '100%', height: '420px' }}>
                    <Line
                        ref={chartRef}
                        className={className ?? 'detail-chart-canvas'}
                        data={chartData}
                        options={chartOptions}
                    />
                </div>
            </div>
        </div>
    );
}

export interface DetailRangeNavProps {
    title?: string;
    start: number;
    end: number;
    rangeType: RangeType;
    onSelectPreset: (rangeType: RangeType) => void;
    onChangeStart: (date: Date) => void;
    onChangeEnd: (date: Date) => void;
}

export function resolveRangeType(start: number, end: number, isCustom: boolean): RangeType {
    if (!isCustom && equalInDays(end, Date.now())) {
        const diff = end - start;
        if (Math.abs(diff - DAY) < HOUR * 12) {
            return RangeType.Last24Hours;
        }
        if (equalInDays(diff, WEEK)) {
            return RangeType.LastWeek;
        }
        if (equalInDays(diff, THIRTY_DAYS)) {
            return RangeType.Last30Days;
        }
        if (equalInDays(diff, NINETY_DAYS)) {
            return RangeType.Last90Days;
        }
    }
    return RangeType.Custom;
}

export function computeRangeBounds(
    rangeType: RangeType,
    customStart: Date,
    customEnd: Date
): { start: number; end: number; isCustom: boolean } {
    let end = Date.now();
    let start = end - WEEK;
    let isCustom = false;

    switch (rangeType) {
        case RangeType.Last24Hours:
            start = end - DAY;
            return { start, end, isCustom: false };
        case RangeType.LastWeek:
            start = end - WEEK;
            break;
        case RangeType.Last30Days:
            start = end - THIRTY_DAYS;
            break;
        case RangeType.Last90Days:
            start = end - NINETY_DAYS;
            break;
        case RangeType.Custom:
            start = customStart.valueOf();
            end = customEnd.valueOf();
            isCustom = true;
            break;
    }

    start = new Date(start).setHours(0, 0, 0, 0);
    end = new Date(end).setHours(23, 59, 59, 999);
    return { start, end, isCustom };
}

export function DetailRangeNav(props: DetailRangeNavProps) {
    const { title, start, end, rangeType, onSelectPreset, onChangeStart, onChangeEnd } = props;

    const handlePresetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectPreset(+e.currentTarget.value as RangeType);
    };

    return (
        <nav className="navbar navbar-expand-md sticky-top detail-toolbar rounded mb-3 p-2 align-items-md-center">
            <div className="d-flex align-items-center me-3">
                <Link to="/" className="btn btn-primary me-3">
                    Späť
                </Link>
                {title && <span className="navbar-brand mb-0 h6">{title}</span>}
            </div>
            <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#detailNavbarControls"
                aria-controls="detailNavbarControls"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse mt-2 mt-md-0" id="detailNavbarControls">
                <div className="d-flex flex-wrap align-items-center gap-2 w-100">
                    <div className="form-check form-check-inline mb-0">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="duration"
                            id="durationDay"
                            value={RangeType.Last24Hours}
                            checked={rangeType === RangeType.Last24Hours}
                            onChange={handlePresetChange}
                        />
                        <label className="form-check-label" htmlFor="durationDay">
                            24 hodín
                        </label>
                    </div>
                    <div className="form-check form-check-inline mb-0">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="duration"
                            id="durationWeek"
                            value={RangeType.LastWeek}
                            checked={rangeType === RangeType.LastWeek}
                            onChange={handlePresetChange}
                        />
                        <label className="form-check-label" htmlFor="durationWeek">
                            1 týždeň
                        </label>
                    </div>
                    <div className="form-check form-check-inline mb-0">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="duration"
                            id="durationMonth"
                            value={RangeType.Last30Days}
                            checked={rangeType === RangeType.Last30Days}
                            onChange={handlePresetChange}
                        />
                        <label className="form-check-label" htmlFor="durationMonth">
                            30 dni
                        </label>
                    </div>
                    <div className="form-check form-check-inline mb-0">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="duration"
                            id="durationQuarter"
                            value={RangeType.Last90Days}
                            checked={rangeType === RangeType.Last90Days}
                            onChange={handlePresetChange}
                        />
                        <label className="form-check-label" htmlFor="durationQuarter">
                            90 dni
                        </label>
                    </div>
                    <div className="form-check form-check-inline mb-0">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="duration"
                            id="durationCustom"
                            value={RangeType.Custom}
                            checked={rangeType === RangeType.Custom}
                            onChange={handlePresetChange}
                        />
                        <label className="form-check-label" htmlFor="durationCustom">
                            Vlastné
                        </label>
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-md-auto">
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            aria-label="Od"
                            value={formatDateInput(start)}
                            disabled={rangeType !== RangeType.Custom}
                            onChange={(e) =>
                                e.target.value && onChangeStart(new Date(e.target.value + 'T00:00:00'))
                            }
                        />
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            aria-label="Do"
                            value={formatDateInput(end)}
                            disabled={rangeType !== RangeType.Custom}
                            onChange={(e) =>
                                e.target.value && onChangeEnd(new Date(e.target.value + 'T23:59:59'))
                            }
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
}
