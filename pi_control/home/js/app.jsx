import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import TemperatureWidget from './temperature.jsx';
import PcStatusWidget from './pc_status.jsx';
import PingWidget from './network.jsx'
import ServerStatsWidget from './server_stats.jsx';


async function getTemperatureData() {
    const devices = (await axios.get("/api/temperature/devices/")).data;
    console.log(devices);

    const currentDataPromises = devices.map(device => axios.get("/api/temperature/now/?device=" + device.id));
    const graphPromises = devices.map(device => axios.get("/api/temperature/list/?device=" + device.id));
    const allPromises = [Promise.all(currentDataPromises), Promise.all(graphPromises)];
    const allData = await Promise.all(allPromises);

    const currentDatas = allData[0].map(response => response.data);
    const graphDatas = allData[1].map(response => response.data);

    console.log(currentDatas, graphDatas);

    let deviceToCurrentData = new Map();
    for (let i in currentDatas) {
        let currentData = currentDatas[i];
        deviceToCurrentData.set(currentData.device, currentData);
    }

    let deviceToGraphData = new Map();
    for (let i in graphDatas) {
        let graphData = graphDatas[i];
        if (graphData.length > 0) {
            deviceToGraphData.set(graphData[0].device, graphData);
        }
    }

    let result = [];
    for (let i in devices) {
        let device = devices[i];
        result.push({
            device: device,
            current_data: deviceToCurrentData.get(device.id),
            graph_data: deviceToGraphData.get(device.id),
        })
    }

    return result;
}


class Widgets extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            temperature_humidity_data: [],
            ping_time_list: [],
            pc_status_data: {
                online: 'N/A',
                ssh: 'N/A',
                title: 'N/A',
            },
            server_stats_data: null
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

        getTemperatureData().then(response => {
            self.setState({temperature_humidity_data: response});
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
            <TemperatureWidget data={this.state.temperature_humidity_data}/>
            <PcStatusWidget title={this.state.pc_status_data.name} status={this.state.pc_status_data.online}
                            ssh={this.state.pc_status_data.ssh} time={this.state.pc_status_data.time}/>
            <ServerStatsWidget data={this.state.server_stats_data}/>
            <PingWidget historicData={this.state.ping_time_list}/>
        </div>
    }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
