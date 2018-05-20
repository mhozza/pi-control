import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

class TemperatureWidget extends React.Component {
    render() {
        let time = new Date(this.props.time).toLocaleString();
        let colorClass = this.props.value > this.props.high
            ? "text-danger"
            : this.props.value < this.props.low
                ? "text-primary"
                : "text-success";

        return (<div className="card">
            <div className="card-header text-center">{this.props.title}</div>
            <div className="card-body">
                <div className={"card-text text-center temperature-widget-body " + colorClass}>
                    {this.props.value}
                    <sup><span>{this.props.unit}</span></sup>
                </div>
            </div>
            <div className="card-footer text-muted text-center">{time}</div>
        </div>);
    }
}


class PcStatusWidget extends React.Component {
    render() {
        let time = new Date(this.props.time).toLocaleString();
        return (<div className="card">
            <div className="card-header text-center">{this.props.title}</div>
            <div className="card-body">
                <div className="card-text text-center pc_status-widget-primary">
                    <span className={this.props.status ? "text-success" : "text-danger"}>
                        {this.props.status ? "online" : "offline"}
                    </span>
                </div>
                <div className="card-text text-center pc_status-widget-secondary">
                    SSH: <span className={this.props.ssh ? "text-success" : "text-danger"}>
                        {this.props.ssh ? "online" : "offline"}
                    </span>
                </div>
            </div>
            <div className="card-footer text-muted text-center">{time}</div>
        </div>);
    }
}

class Widgets extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            temperature_data: {
                temperature: {
                    value: null,
                    high: null,
                    low: null,
                },
                humidity: {
                    value: null,
                    high: null,
                    low: null,
                },
                time: null,
            },
            pc_status_data: {
                online: null,
                ssh: null,
            }
        };
    }

    componentDidMount() {
        this.tick();
        this.timerID = setInterval(
            () => this.tick(),
            15000
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    tick() {
        let self = this;
        axios.get("/api/temperature/now/").then(response => {
            self.setState({
                temperature_data: response.data
            });
        });

        axios.get("/api/pc_status").then(response => {
            self.setState({
                pc_status_data: response.data
            });
        });
    }

    render() {
        return <div className="row">
            <div className="col-sm-6 col-md-3">
                <TemperatureWidget title="Teplota" value={this.state.temperature_data.temperature.value} unit="°C"
                                   time={this.state.temperature_data.time}
                                   high={this.state.temperature_data.temperature.high}
                                   low={this.state.temperature_data.temperature.low}/>
            </div>
            <div className="col-sm-6 col-md-3">
                <TemperatureWidget title="Vlhkosť" value={this.state.temperature_data.humidity.value} unit="%"
                                   time={this.state.temperature_data.time}
                                   high={this.state.temperature_data.humidity.high}
                                   low={this.state.temperature_data.humidity.low}/>
            </div>

            <div className="col-sm-6 col-md-3">
                <PcStatusWidget title={this.state.pc_status_data.name}
                                status={this.state.pc_status_data.online}
                                ssh={this.state.pc_status_data.ssh}
                                time={this.state.pc_status_data.time}/>
            </div>
        </div>
    }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
