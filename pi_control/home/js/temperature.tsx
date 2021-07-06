import * as React from "react";
import { Line } from 'react-chartjs-2';
import { LoadingSpinner } from './loading';
import { Widget } from './widget'
import axios from "axios";
import 'chartjs-adapter-date-fns';
import { ChartData, ChartOptions } from "chart.js";
import { Link, useParams, RouteComponentProps } from 'react-router-dom';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
am4core.useTheme(am4themes_animated);


const DISPLAY_FORMATS = {
    hour: 'HH:mm',
    minute: 'HH:mm',
    second: 'HH:mm:ss',
};

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

async function getTemperatureData(roomId: number, start?: number, end?: number) {
    const roomData = (await axios.get(`/api/temperature/room/${roomId}/now/`)).data as RoomData;

    let temperatureListUrl = "/api/temperature/list/"
    if (start) {
        temperatureListUrl += new Date(start).toISOString() + "/"
        if (end) {
            temperatureListUrl += new Date(end).toISOString() + "/"
        }
    }

    const graphPromises = roomData.devices.map(device_info => axios.get(`${temperatureListUrl}?device=${device_info.device}`));
    const graphDatas = (await Promise.all(graphPromises)).map(response => response.data);

    for (let i in roomData.devices) {
        roomData.devices[i].graphData = graphDatas[i];
    }

    return roomData;
}

interface TemperatureWidgetSetState {
    rooms: Room[]
}

export class TemperatureWidgetSet extends Widget {
    state: TemperatureWidgetSetState = {
        rooms: null,
    };

    tick() {
        let self = this;
        axios.get("/api/temperature/rooms/").then(response => {
            self.setState({ rooms: response.data });
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

        const widgets = this.state.rooms.map((room, index) => <TemperatureWidget key={'temperature_data_' + index}
            room={room} />);
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

class TemperatureWidget extends Widget<TemperatureWidgetProps> {
    state: TemperatureWidgetState = {
        data: null,
    };

    tick() {
        getTemperatureData(this.props.room.id).then(response => {
            this.setState({ data: response });
        });
    }


    render() {
        let room = this.props.room;

        if (this.state.data === null) {
            return <div className="col">
                <div className="card text-center">
                    <div className="card-header">{room.name}</div>
                    <LoadingSpinner />
                </div>
            </div>;
        }

        let time = new Date(this.state.data.time).toLocaleString();

        let temperatureColorClass = this.state.data.temperature.value > this.state.data.temperature.high
            ? "text-danger"
            : this.state.data.temperature.value < this.state.data.temperature.low
                ? "text-primary"
                : "text-success";
        let humidityColorClass = this.state.data.humidity.value > this.state.data.humidity.high
            ? "text-danger"
            : this.state.data.humidity.value < this.state.data.humidity.low
                ? "text-primary"
                : "text-success";

        let device_data = this.state.data.devices.map(device_info =>
            <DeviceData key={'temperature_room_data_' + device_info.device}
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
                needs_details={this.state.data.devices.length > 1} />);

        return (
            <div className="col">
                <div className="card text-center">
                    <div className="card-header align-middle">
                        <div className="row align-items-center">
                            <div className="col-8 offset-2 d-inline-block">{room.name}</div>
                            <div className="col-2 text-end">
                                <Link to={`/temperature/${room.id}`} className="btn btn-link"><i className="bi bi-arrows-fullscreen"></i></Link>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <a className="temperature-tappable-header" data-bs-toggle="collapse" role="button"
                            href={`#collapse_${room.id}`} aria-expanded="false" aria-controls={`collapse_${room.id}`}>
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
            </div>);
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

class DeviceData extends React.Component<DeviceDataProps> {
    render() {
        let labels = this.props.data.map(x => x.time);
        let temperature_dataset = this.props.data.map(x => x.temperature);
        let humidity_dataset = this.props.data.map(x => x.humidity);
        let device = this.props.device;

        let temperatureColorClass = this.props.temperature.value > this.props.temperature.high
            ? "text-danger"
            : this.props.temperature.value < this.props.temperature.low
                ? "text-primary"
                : "text-success";
        let humidityColorClass = this.props.humidity.value > this.props.humidity.high
            ? "text-danger"
            : this.props.humidity.value < this.props.humidity.low
                ? "text-primary"
                : "text-success";

        let chartData: ChartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Teplota (°C)',
                    data: temperature_dataset,
                    borderColor: 'rgba(220, 53, 69, .8)',
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y1',
                    cubicInterpolationMode: 'monotone'
                }, {
                    label: 'Vlhkosť (%)',
                    data: humidity_dataset,
                    borderColor: 'rgba(0, 123, 255, .8)',
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y2',
                    cubicInterpolationMode: 'monotone'
                }
            ]
        };
        let chartOptions: ChartOptions = {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'HH:mm',
                        displayFormats: DISPLAY_FORMATS,
                    },
                    ticks: {
                        source: 'data',
                        autoSkip: true
                    },
                    title: {
                        display: false,
                    }
                },
                y1: {
                    type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Teplota'
                    },
                    suggestedMin: 20,
                    suggestedMax: 30
                },
                y2: {
                    type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Vlhkosť'
                    },
                    suggestedMin: 30,
                    suggestedMax: 50,
                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    }
                }
            }
        };

        let details: string | React.ReactFragment = '';
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
                <Line className="card-img-bottom" data={chartData} options={chartOptions} width={150} height={100} />
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

const DAY = 3600000 * 24;
const WEEK = DAY * 7;
const THIRTY_DAYS = DAY * 30;
const NINETY_DAYS = DAY * 90;

enum RangeType {
    Custom,
    LastWeek,
    Last30Days,
    Last90Days,
}

export class TemperatureDetail extends React.Component<RouteComponentProps<TemperatureDetailParams>> {
    readonly room: number = +this.props.match.params.id;

    customStartDate: Date = new Date(Date.now() - WEEK);
    customEndDate: Date = new Date(Date.now());

    state: TemperatureDetailState = {
        data: null,
        start: Date.now() - WEEK,
        end: Date.now(),
        isCustom: false,
    };

    componentDidMount() {
        getTemperatureData(this.room, this.state.start, this.state.end).then(response => {
            this.setState({ data: response });
        });
    }

    setStartDate = (date: Date) => {
        this.customStartDate = date;
        this.setRange(RangeType.Custom);
    }

    setEndDate = (date: Date) => {
        this.customEndDate = date;
        this.setRange(RangeType.Custom);
    }

    setRangeFromPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rangeType: RangeType = +e.currentTarget.value;
        this.setRange(rangeType);
    }

    setRange = (rangeType: RangeType) => {
        let end: any = Date.now()
        let start
        let isCustom = false

        switch (rangeType) {
            case RangeType.LastWeek:
                start = Date.now() - WEEK
                break
            case RangeType.Last30Days:
                start = Date.now() - THIRTY_DAYS
                break
            case RangeType.Last90Days:
                start = Date.now() - NINETY_DAYS
                break
            case RangeType.Custom:
                start = this.customStartDate.valueOf()
                end = this.customEndDate.valueOf()
                isCustom = true
        }

        start = new Date(start).setHours(0, 0, 0, 0)
        end = new Date(end).setHours(23, 59, 59, 999)
        this.customStartDate = new Date(start);
        this.customEndDate = new Date(end);

        this.setState({ start: start, end: end, isCustom: isCustom })
        getTemperatureData(this.room, start, end).then(response => {
            this.setState({ data: response });
        });
    }

    render() {
        if (this.state.data === null) {
            return <LoadingSpinner />;
        }

        let rangeType = RangeType.Custom;

        if (!this.state.isCustom && equalInDays(this.state.end, Date.now())) {
            if (equalInDays(this.state.end - this.state.start, WEEK)) {
                rangeType = RangeType.LastWeek
            } else if (equalInDays(this.state.end - this.state.start, THIRTY_DAYS)) {
                rangeType = RangeType.Last30Days
            } else if (equalInDays(this.state.end - this.state.start, NINETY_DAYS)) {
                rangeType = RangeType.Last90Days
            }
        }

        const device_data = this.state.data.devices.map(device_info =>
            <TemperatureDetailGraph key={'temperature_room_data_' + device_info.device}
                device={{ id: device_info.device, name: device_info.device_name }}
                data={device_info.graphData} />);

        return <div className="container">
            <nav className="navbar navbar-expand-md navbar-light sticky-top bg-light d-flex p-2 align-items-md-center">
                <Link to="/" className="btn btn-primary me-3">Späť</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarTogglerDemo01" aria-controls="navbarTogglerDemo01" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse mt-1 mt-md-0" id="navbarTogglerDemo01">
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="duration" id="durationWeek" value={RangeType.LastWeek} checked={rangeType == RangeType.LastWeek} onChange={this.setRangeFromPreset} />
                        <label className="form-check-label" htmlFor="durationWeek">
                            1 týždeň
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="duration" id="durationMonth" value={RangeType.Last30Days} checked={rangeType == RangeType.Last30Days} onChange={this.setRangeFromPreset} />
                        <label className="form-check-label" htmlFor="durationMonth">
                            30 dni
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="duration" id="durationQuarter" value={RangeType.Last90Days} checked={rangeType == RangeType.Last90Days} onChange={this.setRangeFromPreset} />
                        <label className="form-check-label" htmlFor="durationQuarter">
                            90 dni
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="duration" id="durationCustom" value={RangeType.Custom} checked={rangeType == RangeType.Custom} onChange={this.setRangeFromPreset} />
                        <label className="form-check-label" htmlFor="durationCustom">
                            Vlastné
                        </label>
                    </div>
                    <DatePicker className="form-control form-control-sm" wrapperClassName="w-100" dateFormat="yyyy-MM-dd" selected={new Date(this.state.start)} disabled={rangeType != RangeType.Custom} onChange={this.setStartDate} />
                    <DatePicker className="form-control form-control-sm" wrapperClassName="w-100" dateFormat="yyyy-MM-dd" selected={new Date(this.state.end)} disabled={rangeType != RangeType.Custom} onChange={this.setEndDate} />
                </div>
            </nav>

            {device_data}
        </div>
    }
}

interface TemperatureDetailGraphProps {
    device: Device;
    data: Entry[];
}

class TemperatureDetailGraph extends React.Component<TemperatureDetailGraphProps> {
    chart: am4charts.XYChart;
    readonly divId = `chartdiv_${this.props.device.id}`;

    setChartData(chart: am4charts.XYChart, data: Entry[]) {
        chart.data = data.map(x => { return { date: new Date(x.time), temperature: x.temperature, humidity: x.humidity } });
    }

    componentDidMount() {
        let chart = am4core.create(this.divId, am4charts.XYChart);

        chart.paddingRight = 20;

        this.setChartData(chart, this.props.data);

        let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.grid.template.location = 0;

        let temperatureAxes = chart.yAxes.push(new am4charts.ValueAxis());
        temperatureAxes.tooltip.disabled = true;
        temperatureAxes.renderer.minWidth = 35;
        temperatureAxes.title.text = "Teplota (°C)";

        let humidityAxes = chart.yAxes.push(new am4charts.ValueAxis());
        humidityAxes.tooltip.disabled = true;
        humidityAxes.renderer.minWidth = 35;
        humidityAxes.title.text = "Vlhkost (%)";
        humidityAxes.renderer.opposite = true;

        let temperatureSeries = chart.series.push(new am4charts.LineSeries());
        temperatureSeries.dataFields.dateX = "date";
        temperatureSeries.dataFields.valueY = "temperature";
        temperatureSeries.tooltipText = "{valueY.value}";
        temperatureSeries.stroke = am4core.color("rgba(220, 53, 69, .8)");
        temperatureSeries.fill = am4core.color("rgba(220, 53, 69, .7)");
        temperatureSeries.smoothing = "monotoneX";

        let humiditySeries = chart.series.push(new am4charts.LineSeries());
        humiditySeries.dataFields.dateX = "date";
        humiditySeries.dataFields.valueY = "humidity";
        humiditySeries.tooltipText = "{valueY.value}";
        humiditySeries.stroke = am4core.color("rgba(0, 123, 255, .8)");
        humiditySeries.fill = am4core.color("rgba(0, 123, 255, .7)");
        humiditySeries.smoothing = "monotoneX";
        humiditySeries.yAxis = humidityAxes;

        chart.cursor = new am4charts.XYCursor();

        let scrollbarX = new am4charts.XYChartScrollbar();
        scrollbarX.series.push(temperatureSeries);
        scrollbarX.series.push(humiditySeries);
        chart.scrollbarX = scrollbarX;

        this.chart = chart;
    }

    componentDidUpdate(oldProps: TemperatureDetailGraphProps) {
        if (oldProps.data !== this.props.data) {
            this.setChartData(this.chart, this.props.data);
        }
    }

    componentWillUnmount() {
        if (this.chart) {
            this.chart.dispose();
        }
    }

    render() {
        return <div id={this.divId} style={{ width: "100%", height: "500px" }}></div>
    }
}

function equalInDays(timeStamp1: number, timestamp2: number) {
    return Math.trunc(timeStamp1 / DAY) == Math.trunc(timestamp2 / DAY);
}