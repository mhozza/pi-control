import React from "react";
import {Line} from 'react-chartjs-2';
import LoadingSpinner from './loading.jsx';
import Widget from './widget.jsx'
import axios from "axios";

const DISPLAY_FORMATS = {
    hour: 'HH:mm',
    minute: 'HH:mm',
    second: 'HH:mm:ss',
};

async function getTemperatureData(room) {
    const roomData = (await axios.get("/api/temperature/room/" + room.id + "/now/")).data;
    const graphPromises = roomData.devices.map(device_info => axios.get("/api/temperature/list/?device=" + device_info.device));
    const graphDatas = (await Promise.all(graphPromises)).map(response => response.data);

    for (let i in roomData.devices) {
        roomData.devices[i].graphData = graphDatas[i];
    }

    return roomData;
}

class TemperatureWidgetSet extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            rooms: null,
        };
    }

    tick() {
        let self = this;
        axios.get("/api/temperature/rooms/").then(response => {
            self.setState({rooms: response.data});
        });
    }

    render() {
        if (this.state.rooms === null) {
            return <div className="col-sm-6 col-md-4">
                <div className="card text-center">
                    <div className="card-header">Teplota a vlhkost</div>
                    <LoadingSpinner/>
                </div>
            </div>;
        }

        const widgets = this.state.rooms.map((room, index) => <TemperatureWidget key={'temperature_data_' + index}
                                                                                 room={room}/>);
        return <React.Fragment>
            {widgets}
        </React.Fragment>;
    }
}

class TemperatureWidget extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
        };
    }

    tick() {
        let self = this;

        getTemperatureData(self.props.room).then(response => {
            self.setState({data: response});
        });
    }


    render() {
        let room = this.props.room;

        if (this.state.data === null) {
            return <div className="col-sm-6 col-md-4">
                <div className="card text-center">
                    <div className="card-header">{room.name}</div>
                    <LoadingSpinner/>
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
                        device={{id: device_info.device, name: device_info.device_name}}
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
                        needs_details={this.state.data.devices.length > 1}/>);

        return (
            <div className="col-md-4">
                <div className="card text-center">
                    <div className="card-header text-center">{room.name}</div>
                    <div className="card-body">
                        <a className="temperature-tappable-header" data-toggle="collapse" role="button"
                           href={"#collapse_" + room.id} aria-expanded="false" aria-controls={"collapse_" + room.id}>
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
                    <div className="collapse" id={"collapse_" + room.id}>
                        {device_data}
                    </div>
                    <div className="card-footer text-muted">{time}</div>
                </div>
            </div>);
    }
}

class DeviceData extends React.Component {
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

        let chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Teplota',
                    data: temperature_dataset,
                    borderColor: 'rgba(220, 53, 69, .8)',
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y-axis-1',
                    cubicInterpolationMode: 'monotone'
                }, {
                    label: 'Vlhkosť',
                    data: humidity_dataset,
                    borderColor: 'rgba(0, 123, 255, .8)',
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y-axis-2',
                    cubicInterpolationMode: 'monotone'
                }
            ]
        };
        let chartOptions = {
            responsive: true,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        tooltipFormat: 'HH:mm',
                        displayFormats: DISPLAY_FORMATS,
                    },
                    ticks: {
                        source: 'data',
                        autoSkip: true
                    },
                    scaleLabel: {
                        display: false,
                    }
                }],
                yAxes: [
                    {
                        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                        display: true,
                        position: 'left',
                        id: 'y-axis-1',
                        scaleLabel: {
                            display: true,
                            labelString: 'Teplota'
                        },
                        ticks: {
                            suggestedMin: 20,
                            suggestedMax: 30
                        }
                    }, {
                        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                        display: true,
                        position: 'right',
                        id: 'y-axis-2',
                        scaleLabel: {
                            display: true,
                            labelString: 'Vlhkosť'
                        },
                        ticks: {
                            suggestedMin: 30,
                            suggestedMax: 50
                        },
                        // grid line settings
                        gridLines: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        }
                    }
                ]
            }
        };

        let details = '';
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
                <Line className="card-img-bottom" data={chartData} options={chartOptions} width={150} height={100}/>
            </React.Fragment>
        );
    }
}

module.exports = TemperatureWidgetSet;