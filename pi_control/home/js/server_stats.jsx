import React from "react";


class ServerStatsWidget extends React.Component {
    render() {
        let time = new Date(this.props.time).toLocaleString();
        let backuptime = new Date(this.props.backuptime).toLocaleString();

        let cpuColorClass = this.props.cpu > 50
            ? "text-danger"
            : "text-success";

        let memoryColorClass = this.props.memory > 50
            ? "text-danger"
            : "text-success";

        let swapColorClass = this.props.swap > 50
            ? "text-danger"
            : "text-success";


        return (<div className="col-sm-6 col-md-4">
            <div className="card text-center">
                <div className="card-header">{this.props.title}</div>
                <div className="card-body">
                    <div className="card-text row">
                        <div className="col-4 text-center">
                            <div>CPU</div>
                            <div className={"serverstats-controls " + cpuColorClass}>
                                {this.props.cpu}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div>RAM</div>
                            <div className={"serverstats-controls " + memoryColorClass}>
                                {this.props.memory}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div>SWAP</div>
                            <div className={"serverstats-controls " + swapColorClass}>
                                {this.props.swap}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                    </div>
                    <p className="card-text">
                        <strong>Čas od zapnutia:</strong> {this.props.uptime}
                        <br/>
                        <strong>Posledná záloha:</strong> {backuptime}
                    </p>
                </div>
                <div className="card-footer text-muted">{time}</div>
            </div>
        </div>);
    }
}

module.exports = ServerStatsWidget;