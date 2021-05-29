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

async function getTemperatureData(roomId: number) {
    const roomData = (await axios.get("/api/temperature/room/" + roomId + "/now/")).data as RoomData;
    const graphPromises = roomData.devices.map(device_info => axios.get("/api/temperature/list/?device=" + device_info.device));
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
            return <div className="col-sm-6 col-md-4">
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
            return <div className="col-sm-6 col-md-4">
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
            <div className="col-md-4">
                <div className="card text-center">
                    <div className="card-header"><span className="">{room.name}</span> <Link to={`/temperature/${room.id}`} className="btn btn-link"><i className="bi bi-arrows-fullscreen"></i></Link></div>
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

export class TemperatureDetail extends React.Component<RouteComponentProps<TemperatureDetailParams>> {
    readonly room: number = +this.props.match.params.id;

    state: TemperatureWidgetState = {
        data: null,
    };

    componentDidMount() {
        getTemperatureData(this.room).then(response => {
            this.setState({ data: response });
        });
    }

    render() {
        if (this.state.data === null) {
            return <LoadingSpinner />;
        }

        let device_data = this.state.data.devices.map(device_info =>
            <TemperatureDetailGraph key={'temperature_room_data_' + device_info.device}
                device={{ id: device_info.device, name: device_info.device_name }}
                data={device_info.graphData} />);

        return <div className="container">
            <nav className="navbar sticky-top navbar-light bg-light">
            <div className="container-fluid">
                <ul className="navbar-nav">
                <li className="nav-item">
                  <Link to="/" className="btn btn-primary">Back</Link>
                </li>
                </ul>
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

    componentDidMount() {
        let chart = am4core.create(this.divId, am4charts.XYChart);

        chart.paddingRight = 20;

        chart.data = this.props.data.map(x => { return { date: new Date(x.time), temperature: x.temperature, humidity: x.humidity } });

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

    componentWillUnmount() {
        if (this.chart) {
            this.chart.dispose();
        }
    }

    render() {
        return <div id={this.divId} style={{ width: "100%", height: "500px" }}></div>
    }
}