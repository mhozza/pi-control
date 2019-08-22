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

async function getTemperatureData() {
    const rooms = (await axios.get("/api/temperature/rooms/")).data;
    console.log(rooms);

    const currentDataPromises = rooms.map(room => axios.get("/api/temperature/room/" + room.id + "/now/"));
    const roomDatas = (await Promise.all(currentDataPromises)).map(response => response.data);
    const graphPromises = roomDatas.map(roomData =>
        Promise.all(roomData.devices.map(device_info => axios.get("/api/temperature/list/?device=" + device_info.device)))
    );
    const graphDatas = (await Promise.all(graphPromises)).map(response_list => response_list.map(response => response.data));

    console.log(roomDatas, graphDatas);

    let roomToCurrentData = new Map();
    for (let i in roomDatas) {
        let roomData = roomDatas[i];
        for (let j in roomData.devices) {
            roomData.devices[j].graphData = graphDatas[i][j];
        }
        roomToCurrentData.set(roomData.room.toString(), roomData);
    }

    let result = [];
    for (let i in rooms) {
        let room = rooms[i];
        result.push({
            room: room,
            data: roomToCurrentData.get(room.id),
        })
    }

    return result;
}

class TemperatureWidgetSet extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
        };
    }

    tick() {
        let self = this;

        getTemperatureData().then(response => {
            self.setState({data: response});
        });
    }

    render() {
        let room_widgets = [];
        if (this.state.data.length === 0) {
            room_widgets = <LoadingSpinner/>;
        } else {
            for (let i in this.state.data) {
                let room = this.state.data[i].room;
                let room_data = this.state.data[i].data;

                room_widgets.push(<TemperatureWidget key={'temperature_data_' + room.id} room={room}
                                                     data={room_data}/>);
            }
        }
        return (
            <React.Fragment>
                {room_widgets}
            </React.Fragment>);
    }
}

class TemperatureWidget extends React.Component {
    render() {
        let room = this.props.room;
        let temperatureColorClass = this.props.data.temperature.value > this.props.data.temperature.high
            ? "text-danger"
            : this.props.data.temperature.value < this.props.data.temperature.low
                ? "text-primary"
                : "text-success";
        let humidityColorClass = this.props.data.humidity.value > this.props.data.humidity.high
            ? "text-danger"
            : this.props.data.humidity.value < this.props.data.humidity.low
                ? "text-primary"
                : "text-success";

        let device_data = this.props.data.devices.map(device_info =>
            <DeviceData key={'temperature_room_data_' + device_info.device}
                        device={{id: device_info.device, name: device_info.device_name}}
                        temperature={{
                            value: device_info.temperature,
                            low: this.props.data.temperature.low,
                            high: this.props.data.temperature.high,
                        }}
                        humidity={{
                            value: device_info.humidity,
                            low: this.props.data.humidity.low,
                            high: this.props.data.humidity.high,
                        }}
                        data={device_info.graphData}
                        needs_details={this.props.data.devices.length > 1}/>);

        return (
            <div className="col-md-4">
                <div className="card">
                    <div className="card-header text-center">{room.name}</div>
                    <div className="card-body">
                        <a className="temperature-tappable-header" data-toggle="collapse" role="button"
                           href={"#collapse_" + room.id} aria-expanded="false" aria-controls={"collapse_" + room.id}>
                            <div className="card-text row">
                                <div className={"col-6 text-center temperature-widget-body " + temperatureColorClass}>
                                    {this.props.data.temperature.value.toFixed(1)}
                                    <sup>
                                        <span>°C</span>
                                    </sup>
                                </div>
                                <div className={"col-6 text-center temperature-widget-body " + humidityColorClass}>
                                    {this.props.data.humidity.value.toFixed(1)}
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