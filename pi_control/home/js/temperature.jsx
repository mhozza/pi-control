import React from "react";
import {Line} from 'react-chartjs-2';


const DISPLAY_FORMATS = {
    hour: 'HH:mm',
    minute: 'HH:mm',
    second: 'HH:mm:ss',
};


class TemperatureWidget extends React.Component {
    render() {
        if (this.props.data.length === 0) {
            return <div>Loading</div>;
        }

        let device_widgets = [];

        for (let i in this.props.data) {
            let device = this.props.data[i].device;
            let current_data = this.props.data[i].current_data;
            let graph_data = this.props.data[i].graph_data;

            device_widgets.push(<TemperatureData key={'temperature_data_' + device.id} device={device}
                                                 currentData={current_data} historicData={graph_data}/>);
        }

        return (<div className="col-md-4">
            <div className="card">
                <div className="card-header text-center">Teplota a vlhkosť</div>
                {device_widgets}
            </div>
        </div>);
    }
}

class TemperatureData extends React.Component {
    render() {
        let labels = this.props.historicData.map(x => x.time);
        let temperature_dataset = this.props.historicData.map(x => x.temperature);
        let humidity_dataset = this.props.historicData.map(x => x.humidity);
        let device = this.props.device;

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

        // let time = new Date(this.props.currentData.time).toLocaleString();

        let temperatureColorClass = this.props.currentData.temperature.value > this.props.currentData.temperature.high
            ? "text-danger"
            : this.props.currentData.temperature.value < this.props.currentData.temperature.low
                ? "text-primary"
                : "text-success";

        let humidityColorClass = this.props.currentData.humidity.value > this.props.currentData.humidity.high
            ? "text-danger"
            : this.props.currentData.humidity.value < this.props.currentData.humidity.low
                ? "text-primary"
                : "text-success";

        return (
            <div>
                <div className="card-body">
                    <h5 className="card-title text-center">{device.name}</h5>
                    <a className="temperature-tappable-header" data-toggle="collapse" role="button"
                       href={"#collapse_" + device.id} aria-expanded="false" aria-controls={"collapse_" + device.id}>
                        <div className="card-text row">
                            <div className={"col-6 text-center temperature-widget-body " + temperatureColorClass}>
                                {this.props.currentData.temperature.value}
                                <sup>
                                    <span>°C</span>
                                </sup>
                            </div>
                            <div className={"col-6 text-center temperature-widget-body " + humidityColorClass}>
                                {this.props.currentData.humidity.value}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                    </a>
                </div>
                <div className="collapse" id={"collapse_" + device.id}>
                    <Line className="card-img-bottom" data={chartData} options={chartOptions} width={150} height={100}/>
                </div>
                {/*<div className="card-footer text-muted text-center">{time}</div>*/}
            </div>);
    }
}

module.exports = TemperatureWidget;