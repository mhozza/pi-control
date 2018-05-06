import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

class TemperatureWidget extends React.Component {
  render() {
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{this.props.title}</h5>
          <div className="card-text text-center temperature-widget-body">
            <span className="temperature-widget-big-value">{this.props.value}</span>
            <span className="temperature-widget-unit">{this.props.unit}</span>
        </div>
        </div>
      </div>
    );
  }
}

function update_temperature() {
  axios.get("/api/temperature").then(
    response => {
      console.log(response);
      ReactDOM.render(
        <TemperatureWidget title="Teplota" value={response.data.temperature} unit="°C"/>,
        document.getElementById('temperature_widget')
      );
      ReactDOM.render(
        <TemperatureWidget title="Vlhkost" value={response.data.humidity} unit="%"/>,
        document.getElementById('humidity_widget')
      );
    }
  );
}

update_temperature();
setInterval(update_temperature, 15000);
