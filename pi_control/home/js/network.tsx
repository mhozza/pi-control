import * as React from "react";
import { LoadingSpinner } from './loading';
import { Widget } from './widget';
import axios from "axios";
import { Link, useInRouterContext } from 'react-router-dom';
import {
    TimeSeriesChart,
    DetailRangeNav,
    RangeType,
    WEEK,
    computeRangeBounds,
    resolveRangeType,
} from './chart';

export interface PingData {
    time: string;
    ping: number;
}

interface PingWidgetState {
    data: PingData[];
}

function DetailLink(props: {
    to: string;
    className?: string;
    title?: string;
    ariaLabel?: string;
    children: React.ReactNode;
}) {
    const inRouter = useInRouterContext();
    if (inRouter) {
        return (
            <Link
                to={props.to}
                className={props.className}
                title={props.title}
                aria-label={props.ariaLabel}
            >
                {props.children}
            </Link>
        );
    }
    return (
        <a
            href={props.to}
            className={props.className}
            title={props.title}
            aria-label={props.ariaLabel}
        >
            {props.children}
        </a>
    );
}

export async function getNetworkData(
    start?: number,
    end?: number,
    maxPoints?: number
): Promise<PingData[]> {
    let url = "/api/network/list/";
    if (start) {
        url += new Date(start).toISOString() + "/";
        if (end) {
            url += new Date(end).toISOString() + "/";
        }
    }
    if (maxPoints) {
        url += `?max_points=${maxPoints}`;
    }
    const response = await axios.get(url);
    return response.data as PingData[];
}

function buildPingChartProps(data: PingData[], isDetail: boolean) {
    const labels = data.map(x => x.time);
    const pingDataset = data.map(x => x.ping);

    return {
        labels,
        series: [
            {
                label: 'Ping latencia',
                unit: ' ms',
                data: pingDataset,
                borderColor: isDetail ? 'rgba(13, 110, 253, .85)' : 'rgba(128, 128, 128, .8)',
                ...(isDetail ? { backgroundColor: 'rgba(13, 110, 253, .12)', fill: true } : {}),
                pointRadius: isDetail ? 0 : 3,
            },
        ],
        axes: [
            {
                id: 'y',
                title: 'Ping (ms)',
                position: 'left' as const,
                beginAtZero: true,
                suggestedMax: 50,
            },
        ],
    };
}

export class PingWidget extends Widget {
    state: PingWidgetState = {
        data: [],
    };

    tick() {
        axios.get("/api/network/list").then(response => {
            this.setState({ data: response.data });
        }).catch(() => {
            // Keep existing state or loading spinner on error
        });
    }

    render() {
        let content: React.ReactNode;
        if (this.state.data.length === 0) {
            content = <LoadingSpinner />;
        } else {
            const chartProps = buildPingChartProps(this.state.data, false);
            content = (
                <TimeSeriesChart
                    variant="preview"
                    tooltipFormat="HH:mm:ss"
                    labels={chartProps.labels}
                    series={chartProps.series}
                    axes={chartProps.axes}
                />
            );
        }

        return (
            <div className="col">
                <div className="card">
                    <div className="card-header align-middle">
                        <div className="row align-items-center">
                            <div className="col-8 offset-2 text-center d-inline-block">Latencia siete</div>
                            <div className="col-2 text-end">
                                <DetailLink
                                    to="/network"
                                    className="btn btn-link btn-sm p-0"
                                    title="Detailný graf"
                                    ariaLabel="Detailný graf Latencia siete"
                                >
                                    <i className="bi bi-arrows-fullscreen"></i>
                                </DetailLink>
                            </div>
                        </div>
                    </div>
                    {content}
                </div>
            </div>
        );
    }
}

interface NetworkDetailState {
    data: PingData[] | null;
    start: number;
    end: number;
    isCustom: boolean;
}

export class NetworkDetail extends React.Component<{}, NetworkDetailState> {
    customStartDate: Date = new Date(Date.now() - WEEK);
    customEndDate: Date = new Date(Date.now());

    state: NetworkDetailState = {
        data: null,
        start: Date.now() - WEEK,
        end: Date.now(),
        isCustom: false,
    };

    componentDidMount() {
        getNetworkData(this.state.start, this.state.end, 600).then(data => {
            this.setState({ data });
        }).catch(() => {
            // Keep state or loading on error
        });
    }

    setStartDate = (date: Date) => {
        this.customStartDate = date;
        this.setRange(RangeType.Custom);
    };

    setEndDate = (date: Date) => {
        this.customEndDate = date;
        this.setRange(RangeType.Custom);
    };

    setRange = (rangeType: RangeType) => {
        const { start, end, isCustom } = computeRangeBounds(
            rangeType,
            this.customStartDate,
            this.customEndDate
        );
        this.customStartDate = new Date(start);
        this.customEndDate = new Date(end);

        this.setState({ start, end, isCustom });
        getNetworkData(start, end, 600).then(data => {
            this.setState({ data });
        }).catch(() => {
            // Keep state or loading on error
        });
    };

    render() {
        if (this.state.data === null) {
            return <LoadingSpinner />;
        }

        const rangeType = resolveRangeType(this.state.start, this.state.end, this.state.isCustom);

        return (
            <div>
                <DetailRangeNav
                    title="Latencia siete"
                    start={this.state.start}
                    end={this.state.end}
                    rangeType={rangeType}
                    onSelectPreset={this.setRange}
                    onChangeStart={this.setStartDate}
                    onChangeEnd={this.setEndDate}
                />
                <NetworkDetailGraph data={this.state.data} />
            </div>
        );
    }
}

interface NetworkDetailGraphProps {
    data: PingData[];
}

export class NetworkDetailGraph extends React.Component<NetworkDetailGraphProps> {
    readonly divId = "chartdiv_network_ping";

    render() {
        const chartProps = buildPingChartProps(this.props.data, true);
        return (
            <TimeSeriesChart
                variant="detail"
                containerId={this.divId}
                title="Latencia siete (ms)"
                tooltipFormat="dd.MM.yyyy HH:mm:ss"
                labels={chartProps.labels}
                series={chartProps.series}
                axes={chartProps.axes}
            />
        );
    }
}
