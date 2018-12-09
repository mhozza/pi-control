import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import TemperatureWidget from './temperature.jsx';
import PcStatusWidget from './pc_status.jsx';
import PingWidget from './network.jsx'
import ServerStatsWidget from './server_stats.jsx';


async function getTemperatureData() {
    const rooms = (await axios.get("/api/temperature/rooms/")).data;
    console.log(rooms);

    const currentDataPromises = rooms.map(room => axios.get("/api/temperature/room/" + room.id + "/now/"));
    const roomDatas = (await Promise.all(currentDataPromises)).map(response => response.data);
    const graphPromises = roomDatas.map(roomData =>
        Promise.all(roomData.devices.map(device => axios.get("/api/temperature/list/?device=" + device.id)))
    );
    const graphDatas = (await Promise.all(graphPromises)).map(response_list => response_list.map(response => response.data));

    console.log(roomDatas, graphDatas);

    let roomToCurrentData = new Map();
    for (let i in roomDatas) {
        let roomData = roomDatas[i];
        for (let j in roomData.devices) {
            roomData.devices[j].graphData = graphDatas[i][j];
        }
        roomToCurrentData.set(roomData.room.toString(), roomData);
    }

    let result = [];
    for (let i in rooms) {
        let room = rooms[i];
        result.push({
            room: room,
            data: roomToCurrentData.get(room.id),
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
            pc_status_data: null,
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
            <PcStatusWidget data={this.state.pc_status_data}/>
            <ServerStatsWidget data={this.state.server_stats_data}/>
            <PingWidget data={this.state.ping_time_list}/>
        </div>
    }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
