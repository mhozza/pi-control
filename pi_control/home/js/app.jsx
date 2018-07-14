import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import TemperatureWidget from './temperature.jsx';
import PcStatusWidget from './pc_status.jsx';
import PingWidget from './network.jsx'
import ServerStatsWidget from './server_stats.jsx';


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
                ssh: 'N/A',
                title: 'N/A',
            },
            server_stats_data: {
                time: null,
                title: 'N/A',
                uptime: 'N/A',
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

        axios.get("/api/server_stats").then(response => {
            self.setState({server_stats_data: response.data});
        });
    }

    render() {
        return <div className="row">
            <TemperatureWidget currentData={this.state.temperature_now} historicData={this.state.temperature_list}/>
            <PcStatusWidget title={this.state.pc_status_data.name} status={this.state.pc_status_data.online}
                            ssh={this.state.pc_status_data.ssh} time={this.state.pc_status_data.time}/>
            <PingWidget historicData={this.state.ping_time_list}/>
            <ServerStatsWidget title={this.state.server_stats_data.name} time={this.state.server_stats_data.time}
                               uptime={this.state.server_stats_data.uptime}
                               backuptime={this.state.server_stats_data.backuptime}/>
        </div>
    }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
