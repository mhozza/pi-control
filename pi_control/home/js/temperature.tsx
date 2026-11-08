import * as React from "react";
import { LoadingSpinner } from './loading';
import { Widget } from './widget';
import axios from "axios";
import { Link, useParams } from 'react-router-dom';
import {
    TimeSeriesChart,
    DetailRangeNav,
    RangeType,
    WEEK,
    computeRangeBounds,
    resolveRangeType,
} from './chart';

export { RangeType };

interface Room {
    id: number;
    name: string;
}

interface Entry {
    time: string;
    temperature: number;
    humidity: number;
    device: string;
}

interface Measurement {
    device: string;
    device_name: string;
    temperature: number;
    humidity: number;
    graphData: Entry[];
}

interface BoundedValue {
    value: number;
    high: number;
    low: number;
}

interface RoomData {
    time: string;
    room: number;
    temperature: BoundedValue;
    humidity: BoundedValue;
    devices: Measurement[];
}

export async function getTemperatureData(
    roomId: number,
    start?: number,
    end?: number,
    maxPoints?: number
) {
    const roomData = (await axios.get(`/api/temperature/room/${roomId}/now/`)).data as RoomData;

    let temperatureListUrl = "/api/temperature/list/";
    if (start) {
        temperatureListUrl += new Date(start).toISOString() + "/";
        if (end) {
            temperatureListUrl += new Date(end).toISOString() + "/";
        }
    }

    const extraQuery = maxPoints ? `&max_points=${maxPoints}` : "";
    const graphPromises = roomData.devices.map(device_info =>
        axios.get(`${temperatureListUrl}?device=${device_info.device}${extraQuery}`)
    );
    const graphDatas = (await Promise.all(graphPromises)).map(response => response.data);

    for (let i in roomData.devices) {
        roomData.devices[i].graphData = graphDatas[i];
    }

    return roomData;
}

interface TemperatureWidgetSetState {
    rooms: Room[];
}

export class TemperatureWidgetSet extends Widget {
    state: TemperatureWidgetSetState = {
        rooms: null,
    };

    tick() {
        axios.get("/api/temperature/rooms/").then(response => {
            this.setState({ rooms: response.data });
        }).catch(() => {
            // Keep state or loading on error
        });
    }

    render() {
        if (this.state.rooms === null) {
            return <div className="col">
                <div className="card text-center">
                    <div className="card-header">Teplota a vlhkost</div>
                    <LoadingSpinner />
                </div>
            </div>;
        }

        const widgets = this.state.rooms.map((room, index) => (
            <TemperatureWidget key={'temperature_data_' + index} room={room} />
        ));
        return <React.Fragment>
            {widgets}
        </React.Fragment>;
    }
}

interface TemperatureWidgetProps {
    room: Room;
}

interface TemperatureWidgetState {
    data: RoomData;
}

function getMetricColorClass(metric: BoundedValue): string {
    if (metric.value > metric.high) {
        return "text-danger";
    }
    if (metric.value < metric.low) {
        return "text-primary";
    }
    return "text-success";
}

export class TemperatureWidget extends Widget<TemperatureWidgetProps> {
    state: TemperatureWidgetState = {
        data: null,
    };

    tick() {
        getTemperatureData(this.props.room.id).then(response => {
            this.setState({ data: response });
        }).catch(() => {
            // Keep state or loading on error
        });
    }

    render() {
        const room = this.props.room;

        if (this.state.data === null) {
            return <div className="col">
                <div className="card text-center">
                    <div className="card-header">{room.name}</div>
                    <LoadingSpinner />
                </div>
            </div>;
        }

        const time = new Date(this.state.data.time).toLocaleString();
        const temperatureColorClass = getMetricColorClass(this.state.data.temperature);
        const humidityColorClass = getMetricColorClass(this.state.data.humidity);

        const device_data = this.state.data.devices.map(device_info => (
            <DeviceData
                key={'temperature_room_data_' + device_info.device}
                device={{ id: device_info.device, name: device_info.device_name }}
                temperature={{
                    value: device_info.temperature,
                    low: this.state.data.temperature.low,
                    high: this.state.data.temperature.high,
                }}
                humidity={{
                    value: device_info.humidity,
                    low: this.state.data.humidity.low,
                    high: this.state.data.humidity.high,
                }}
                data={device_info.graphData}
                needs_details={this.state.data.devices.length > 1}
            />
        ));

        return (
            <div className="col">
                <div className="card text-center">
                    <div className="card-header align-middle">
                        <div className="row align-items-center">
                            <div className="col-8 offset-2 d-inline-block">{room.name}</div>
                            <div className="col-2 text-end">
                                <Link
                                    to={`/temperature/${room.id}`}
                                    className="btn btn-link btn-sm p-0"
                                    title="Detailný graf"
                                    aria-label={`Detailný graf ${room.name}`}
                                >
                                    <i className="bi bi-arrows-fullscreen"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <a
                            className="temperature-tappable-header"
                            data-bs-toggle="collapse"
                            role="button"
                            href={`#collapse_${room.id}`}
                            aria-expanded="false"
                            aria-controls={`collapse_${room.id}`}
                        >
                            <div className="card-text row">
                                <div className={"col-6 text-center temperature-widget-body " + temperatureColorClass}>
                                    {this.state.data.temperature.value.toFixed(1)}
                                    <sup>
                                        <span>°C</span>
                                    </sup>
                                </div>
                                <div className={"col-6 text-center temperature-widget-body " + humidityColorClass}>
                                    {this.state.data.humidity.value.toFixed(1)}
                                    <sup>
                                        <span>%</span>
                                    </sup>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div className="collapse" id={`collapse_${room.id}`}>
                        {device_data}
                    </div>
                    <div className="card-footer text-muted">{time}</div>
                </div>
            </div>
        );
    }
}

interface Device {
    id: string;
    name: string;
}

interface DeviceDataProps {
    device: Device;
    temperature: BoundedValue;
    humidity: BoundedValue;
    data: Entry[];
    needs_details: boolean;
}

function buildTemperatureChartProps(data: Entry[]) {
    const labels = data.map(x => x.time);
    const temperatureDataset = data.map(x => x.temperature);
    const humidityDataset = data.map(x => x.humidity);

    return {
        labels,
        series: [
            {
                label: 'Teplota (°C)',
                unit: '°C',
                data: temperatureDataset,
                borderColor: 'rgba(220, 53, 69, .8)',
                backgroundColor: 'rgba(220, 53, 69, .1)',
                pointRadius: 0,
                fill: false,
                yAxisID: 'y1',
            },
            {
                label: 'Vlhkosť (%)',
                unit: '%',
                data: humidityDataset,
                borderColor: 'rgba(0, 123, 255, .8)',
                backgroundColor: 'rgba(0, 123, 255, .1)',
                pointRadius: 0,
                fill: false,
                yAxisID: 'y2',
            },
        ],
        axes: [
            {
                id: 'y1',
                title: 'Teplota',
                position: 'left' as const,
                suggestedMin: 20,
                suggestedMax: 30,
            },
            {
                id: 'y2',
                title: 'Vlhkosť',
                position: 'right' as const,
                suggestedMin: 30,
                suggestedMax: 50,
                drawOnChartArea: false,
            },
        ],
    };
}

export class DeviceData extends React.Component<DeviceDataProps> {
    render() {
        const device = this.props.device;
        const temperatureColorClass = getMetricColorClass(this.props.temperature);
        const humidityColorClass = getMetricColorClass(this.props.humidity);
        const chartProps = buildTemperatureChartProps(this.props.data);

        let details: React.ReactNode = '';
        if (this.props.needs_details) {
            details = <React.Fragment>
                <h5 className="card-title text-center">{device.name}</h5>
                <div className="card-text row">
                    <div className={"offset-2 col-4 text-center " + temperatureColorClass}>
                        {this.props.temperature.value}°C
                    </div>
                    <div className={"col-4 text-center " + humidityColorClass}>
                        {this.props.humidity.value}%
                    </div>
                </div>
            </React.Fragment>;
        }

        return (
            <React.Fragment>
                {details}
                <TimeSeriesChart
                    variant="preview"
                    labels={chartProps.labels}
                    series={chartProps.series}
                    axes={chartProps.axes}
                />
            </React.Fragment>
        );
    }
}

interface TemperatureDetailParams {
    id: string;
}

interface TemperatureDetailState {
    data: RoomData;
    start: number;
    end: number;
    isCustom: boolean;
}

export interface TemperatureDetailProps {
    roomId?: number;
    match?: {
        params: TemperatureDetailParams;
        isExact?: boolean;
        path?: string;
        url?: string;
    };
    location?: any;
    history?: any;
}

export class TemperatureDetailView extends React.Component<{ roomId: number }, TemperatureDetailState> {
    readonly room: number = this.props.roomId;

    customStartDate: Date = new Date(Date.now() - WEEK);
    customEndDate: Date = new Date(Date.now());

    state: TemperatureDetailState = {
        data: null,
        start: Date.now() - WEEK,
        end: Date.now(),
        isCustom: false,
    };

    componentDidMount() {
        getTemperatureData(this.room, this.state.start, this.state.end, 600).then(response => {
            this.setState({ data: response });
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
        getTemperatureData(this.room, start, end, 600).then(response => {
            this.setState({ data: response });
        }).catch(() => {
            // Keep state or loading on error
        });
    };

    render() {
        if (this.state.data === null) {
            return <LoadingSpinner />;
        }

        const rangeType = resolveRangeType(this.state.start, this.state.end, this.state.isCustom);

        const device_data = this.state.data.devices.map(device_info => (
            <TemperatureDetailGraph
                key={'temperature_room_data_' + device_info.device}
                device={{ id: device_info.device, name: device_info.device_name }}
                data={device_info.graphData}
            />
        ));

        return (
            <div>
                <DetailRangeNav
                    title="Teplota a vlhkosť"
                    start={this.state.start}
                    end={this.state.end}
                    rangeType={rangeType}
                    onSelectPreset={this.setRange}
                    onChangeStart={this.setStartDate}
                    onChangeEnd={this.setEndDate}
                />
                {device_data}
            </div>
        );
    }
}

export function TemperatureDetail(props: TemperatureDetailProps) {
    const params = useParams<{ id: string }>();
    const roomId = props.roomId ?? (props.match?.params?.id ? +props.match.params.id : +(params.id || 0));
    return <TemperatureDetailView key={roomId} roomId={roomId} />;
}

interface TemperatureDetailGraphProps {
    device: Device;
    data: Entry[];
}

export class TemperatureDetailGraph extends React.Component<TemperatureDetailGraphProps> {
    readonly divId = `chartdiv_${this.props.device.id}`;

    render() {
        const chartProps = buildTemperatureChartProps(this.props.data);
        return (
            <TimeSeriesChart
                variant="detail"
                containerId={this.divId}
                title={this.props.device.name}
                labels={chartProps.labels}
                series={chartProps.series}
                axes={chartProps.axes}
            />
        );
    }
}
