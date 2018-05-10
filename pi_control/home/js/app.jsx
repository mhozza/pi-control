import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

class TemperatureWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      colorClass: props.value > props.high
        ? "text-danger"
        : props.value < props.low
          ? "text-primary"
          : "text-success"
    };
  }

  render() {
    return (<div className="card">
      <div className="card-header">{this.props.title}</div>
      <div className="card-body">
        <div className={"card-text text-center temperature-widget-body " + this.state.colorClass}>
          {this.props.value}<sup>
            <span>{this.props.unit}</span>
          </sup>
        </div>
      </div>
      <div className="card-footer text-muted text-right">{this.props.time}</div>
    </div>);
  }
}

function update_temperature() {
  axios.get("/api/temperature").then(response => {
    let time = new Date(response.data.time).toLocaleString();

    ReactDOM.render(<TemperatureWidget title="Teplota" value={response.data.temperature} unit="°C" time={time} high="25" low="23"/>, document.getElementById('temperature_widget'));
    ReactDOM.render(<TemperatureWidget title="Vlhkosť" value={response.data.humidity} unit="%" time={time} high="50" low="33"/>, document.getElementById('humidity_widget'));
  });
}

update_temperature();
setInterval(update_temperature, 15000);
