import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {Line} from 'react-chartjs-2';

class TemperatureWidget extends React.Component {
  render() {
    let chartData = {
      labels: this.props.data.labels.map(time => new Date(time).toLocaleTimeString()),
      datasets: [
        {
          data: this.props.data.data,
          borderColor: "rgba(220, 53, 69, .8)",
          backgroundColor: "rgba(0, 0, 0, 0)"
        }
      ]
    };
    let chartOptions = {
      responsive: true,
      legend: {
        display: false
      }
    };

    let time = new Date(this.props.time).toLocaleString();
    let colorClass = this.props.value > this.props.high
      ? "text-danger"
      : this.props.value < this.props.low
        ? "text-primary"
        : "text-success";

    return (<div className="col-sm-6 col-md-3">
      <div className="card">
        <div className="card-header text-center">{this.props.title}</div>
        <div className="card-body">
          <div className={"card-text text-center temperature-widget-body " + colorClass}>
            {this.props.value}
            <sup>
              <span>{this.props.unit}</span>
            </sup>
          </div>
        </div>
        <Line className="card-img-bottom" data={chartData} options={chartOptions} width={100} height={100}/>
        <div className="card-footer text-muted text-center">{time}</div>
      </div>
    </div>);
  }
}

class PcStatusWidget extends React.Component {
  render() {
    let time = new Date(this.props.time).toLocaleString();
    return (<div className="col-sm-6 col-md-3">
      <div className="card">
        <div className="card-header text-center">{this.props.title}</div>
        <div className="card-body">
          <div className="card-text text-center pc_status-widget-primary">
            <span className={this.props.status
                ? "text-success"
                : "text-danger"}>
              {
                this.props.status
                  ? "online"
                  : "offline"
              }
            </span>
          </div>
          <div className="card-text text-center pc_status-widget-secondary">
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
          </div>
        </div>
        <div className="card-footer text-muted text-center">{time}</div>
      </div>
    </div>);
  }
}

class Widgets extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      temperature_list: [],
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
        time: 'N/A'
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
  }

  render() {
    let labels = this.state.temperature_list.map(x => x.time);
    let temperature_dataset = this.state.temperature_list.map(x => x.temperature);
    let humidity_dataset = this.state.temperature_list.map(x => x.humidity);
    return <div className="row">
      <TemperatureWidget title="Teplota" value={this.state.temperature_now.temperature.value} unit="°C" time={this.state.temperature_now.time} high={this.state.temperature_now.temperature.high} low={this.state.temperature_now.temperature.low} data={{
          labels: labels,
          data: temperature_dataset
        }}/>
      <TemperatureWidget title="Vlhkosť" value={this.state.temperature_now.humidity.value} unit="%" time={this.state.temperature_now.time} high={this.state.temperature_now.humidity.high} low={this.state.temperature_now.humidity.low} data={{
          labels: labels,
          data: humidity_dataset
        }}/>

      <PcStatusWidget title={this.state.pc_status_data.name} status={this.state.pc_status_data.online} ssh={this.state.pc_status_data.ssh} time={this.state.pc_status_data.time}/>
    </div>
  }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
