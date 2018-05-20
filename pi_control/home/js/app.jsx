import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {Line} from 'react-chartjs-2';

class TemperatureWidget extends React.Component {
  render() {
    let labels = this.props.historicData.map(x => x.time);
    let temperature_dataset = this.props.historicData.map(x => x.temperature);
    let humidity_dataset = this.props.historicData.map(x => x.humidity);

    let chartData = {
      labels: labels.map(time => new Date(time).toLocaleTimeString()),
      datasets: [
        {
          label: 'Teplota',
          data: temperature_dataset,
          borderColor: 'rgba(220, 53, 69, .8)',
          backgroundColor: 'rgba(220, 53, 69, .8)',
          fill: false,
          yAxisID: 'y-axis-1'
        }, {
          label: 'Vlhkosť',
          data: humidity_dataset,
          borderColor: 'rgba(0, 123, 255, .8)',
          backgroundColor: 'rgba(0, 123, 255, .8)',
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

    return (<div className="col-sm-6 col-md-4">
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
      <TemperatureWidget currentData={this.state.temperature_now} historicData={this.state.temperature_list}/>

      <PcStatusWidget title={this.state.pc_status_data.name} status={this.state.pc_status_data.online} ssh={this.state.pc_status_data.ssh} time={this.state.pc_status_data.time}/>
    </div>
  }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
