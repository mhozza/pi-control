import React from "react";
import {LoadingSpinner} from './loading.jsx';
import {Widget} from './widget.jsx'
import axios from "axios";

export class ServerStatsWidget extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
        };
    }

    tick() {
        let self = this;

        axios.get("/api/server_stats").then(response => {
            self.setState({ data: response.data });
        });
    }

    render() {
        if (this.state.data === null) {
            return <div className="col-sm-6 col-md-4">
                <div className="card text-center">
                    <div className="card-header">Server</div>
                    <LoadingSpinner />
                </div>
            </div>
        }
        let time = new Date(this.state.data.time).toLocaleString();

        let cpuColorClass = this.state.data.cpu > 50
            ? "text-danger"
            : "text-success";

        let memoryColorClass = this.state.data.memory > 50
            ? "text-danger"
            : "text-success";

        let swapColorClass = this.state.data.swap > 50
            ? "text-danger"
            : "text-success";

        let cpuTempColorClass = this.state.data.cpu_temp > 80
            ? "text-danger"
            : "text-success";

        return (<div className="col-sm-6 col-md-4">
            <div className="card text-center">
                <div className="card-header">{this.state.data.name}</div>
                <div className="card-body">
                    <div className="card-text row">
                        <div className="col-4 text-center">
                            <div>CPU</div>
                            <div className={"serverstats-controls " + cpuColorClass}>
                                {this.state.data.cpu}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div>RAM</div>
                            <div className={"serverstats-controls " + memoryColorClass}>
                                {this.state.data.memory}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div>SWAP</div>
                            <div className={"serverstats-controls " + swapColorClass}>
                                {this.state.data.swap}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                    </div>

                    <ul className="list-unstyled card-text">
                        {this.state.data.cpu_temp !== null && <li>
                            <strong>Teplota CPU: </strong>
                            <span className={cpuTempColorClass}>{this.state.data.cpu_temp}°C</span>
                        </li>}
                        <li><strong>Čas od zapnutia: </strong>{this.state.data.uptime}</li>
                    </ul>

                </div>
                <div className="card-footer text-muted">{time}</div>
            </div>
        </div>);
    }
}
