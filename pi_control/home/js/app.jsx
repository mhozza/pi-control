import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import cookie from 'cookie';
import {Line} from 'react-chartjs-2';

const DISPLAY_FORMATS = {
    hour: 'HH:mm',
    minute: 'HH:mm',
    second: 'HH:mm:ss',
};

const csrfcookie = cookie.parse(document.cookie)['csrftoken'];


if (csrfcookie) {
    axios.defaults.headers.post['X-CSRFToken'] = csrfcookie;
}

class TemperatureWidget extends React.Component {
    render() {
        let labels = this.props.historicData.map(x => x.time);
        let temperature_dataset = this.props.historicData.map(x => x.temperature);
        let humidity_dataset = this.props.historicData.map(x => x.humidity);

        let chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Teplota',
                    data: temperature_dataset,
                    borderColor: 'rgba(220, 53, 69, .8)',
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y-axis-1'
                }, {
                    label: 'Vlhkosť',
                    data: humidity_dataset,
                    borderColor: 'rgba(0, 123, 255, .8)',
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y-axis-2'
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

                        // grid line settings
                        gridLines: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        }
                    }
                ]
            }
        };

        let time = new Date(this.props.currentData.time).toLocaleString();

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

        return (<div className="col-md-4">
            <div className="card">
                <div className="card-header text-center">Teplota a vlhkosť</div>
                <div className="card-body">
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
                </div>
                <Line className="card-img-bottom" data={chartData} options={chartOptions} width={150} height={100}/>
                <div className="card-footer text-muted text-center">{time}</div>
            </div>
        </div>);
    }
}

class PcStatusWidget extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false
        };
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }

    handleButtonClick(event) {
        let self = this;
        axios.post("/api/pc_status/wakeup/").then(response => {
            console.log(self, this, event, response);
            self.setState({loading: true});
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.time !== this.props.time) {
            this.setState({loading: false});
        }
    }

    render() {
        let time = new Date(this.props.time).toLocaleString();

        let button;
        if (!this.props.status) {
            if (this.state.loading) {
                button = <button onClick={this.handleButtonClick} className="btn btn-primary btn-block">
                    <i className="fa fa-refresh fa-spin"/> Zapni</button>;
            } else {
                button = <button onClick={this.handleButtonClick} className="btn btn-primary btn-block">
                    Zapni</button>
            }
        }

        return (<div className="col-sm-6 col-md-3">
            <div className="card text-center">
                <div className="card-header">{this.props.title}</div>
                <div className="card-body">
                    <p className="card-text">
                    <span className={"pc_status-widget-primary " + (this.props.status
                        ? "text-success"
                        : "text-danger")}>
                      {
                          this.props.status
                              ? "online"
                              : "offline"
                      }
                    </span>
                        <br/>
                        <span className="pc_status-widget-secondary">
                        SSH:
                        <span className={this.props.ssh
                            ? "text-success"
                            : "text-danger"}>
                          {
                              this.props.ssh
                                  ? "online"
                                  : "offline"
                          }
                        </span>
                    </span>
                    </p>
                    {button}
                </div>
                <div className="card-footer text-muted">{time}</div>
            </div>
        </div>);
    }
}

class PingWidget extends React.Component {
    render() {
        let labels = this.props.historicData.map(x => x.time);
        let ping_dataset = this.props.historicData.map(x => x.ping);

        let chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Ping latencia',
                    data: ping_dataset,
                    borderColor: 'rgba(128, 128, 128, .8)',
                    pointRadius: 0,
                    fill: false,
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
                        tooltipFormat: 'HH:mm:ss',
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
                        type: 'linear',
                        display: true,
                        position: 'left',
                        scaleLabel: {
                            display: true,
                            labelString: 'Ping (ms)'
                        }
                    }
                ]
            }
        };

        return (<div className="col-md-4">
            <div className="card">
                <div className="card-header text-center">Latencia siete</div>
                <Line className="card-img-bottom" data={chartData} options={chartOptions} width={150} height={100}/>
            </div>
        </div>);
    }
}

class Widgets extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            temperature_list: [],
            ping_time_list: [],
            temperature_now: {
                temperature: {
                    value: 'N/A',
                    high: null,
                    low: null
                },
                humidity: {
                    value: 'N/A',
                    high: null,
                    low: null
                },
                time: null
            },
            pc_status_data: {
                online: 'N/A',
                ssh: 'N/A'
            }
        };
    }

    componentDidMount() {
        this.tick();
        this.timerID = setInterval(() => this.tick(), 15000);
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    tick() {
        let self = this;
        axios.get("/api/temperature/now/").then(response => {
            self.setState({temperature_now: response.data});
        });

        axios.get("/api/temperature/list/").then(response => {
            self.setState({temperature_list: response.data});
        });

        axios.get("/api/pc_status").then(response => {
            self.setState({pc_status_data: response.data});
        });

        axios.get("/api/network/list").then(response => {
            self.setState({ping_time_list: response.data});
        });
    }

    render() {
        return <div className="row">
            <TemperatureWidget currentData={this.state.temperature_now} historicData={this.state.temperature_list}/>

            <PcStatusWidget title={this.state.pc_status_data.name} status={this.state.pc_status_data.online}
                            ssh={this.state.pc_status_data.ssh} time={this.state.pc_status_data.time}/>

            <PingWidget historicData={this.state.ping_time_list}/>
        </div>
    }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
