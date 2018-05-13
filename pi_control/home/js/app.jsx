import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

class TemperatureWidget extends React.Component {
    render() {
        let colorClass = this.props.value > this.props.high
            ? "text-danger"
            : this.props.value < this.props.low
                ? "text-primary"
                : "text-success";

        return (<div className="card">
            <div className="card-header text-center">{this.props.title}</div>
            <div className="card-body">
                <div className={"card-text text-center temperature-widget-body " + colorClass}>
                    {this.props.value}<sup>
                    <span>{this.props.unit}</span>
                </sup>
                </div>
            </div>
            <div className="card-footer text-muted text-center">{this.props.time}</div>
        </div>);
    }
}

class Widgets extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {
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
        axios.get("/api/temperature").then(response => {
            self.setState({
                data: response.data
            });
        });
    }

    render() {
        let time = new Date(this.state.data.time).toLocaleString();
        return <div className="row">
            <div className="col-sm-6 col-md-3" id="temperature_widget">
                <TemperatureWidget title="Teplota" value={this.state.data.temperature.value} unit="°C" time={time}
                                   high={this.state.data.temperature.high}
                                   low={this.state.data.temperature.low}/>
            </div>
            <div className="col-sm-6 col-md-3" id="humidity_widget">
                <TemperatureWidget title="Vlhkosť" value={this.state.data.humidity.value} unit="%" time={time}
                                   high={this.state.data.humidity.high}
                                   low={this.state.data.humidity.low}/>
            </div>
        </div>
    }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));