import React from "react";


class ServerStatsWidget extends React.Component {
    render() {
        if (this.props.data === null) {
            return '';
        }
        let time = new Date(this.props.data.time).toLocaleString();
        let backuptime = new Date(this.props.data.backuptime).toLocaleString();
        let updates = this.props.data.updates.total;
        let security_updates = this.props.data.updates.security;

        let cpuColorClass = this.props.data.cpu > 50
            ? "text-danger"
            : "text-success";

        let memoryColorClass = this.props.data.memory > 50
            ? "text-danger"
            : "text-success";

        let swapColorClass = this.props.data.swap > 50
            ? "text-danger"
            : "text-success";

        let updatesColorClass = updates === 0 ? "text-success" : security_updates > 0 ? "text-danger" : "text-warning";

        let service_rows = [];
        for (let service in this.props.data.service_statuses) {
            let up = this.props.data.service_statuses[service];
            let color = up ? "badge-success" : "badge-danger";
            service_rows.push(<li key={service}><span
                className={"badge badge-pill " + color}>{up ? '\u2713' : '\u274C'}</span> {service}</li>);
        }

        return (<div className="col-sm-6 col-md-4">
            <div className="card text-center">
                <div className="card-header">{this.props.data.name}</div>
                <div className="card-body">
                    <div className="card-text row">
                        <div className="col-4 text-center">
                            <div>CPU</div>
                            <div className={"serverstats-controls " + cpuColorClass}>
                                {this.props.data.cpu}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div>RAM</div>
                            <div className={"serverstats-controls " + memoryColorClass}>
                                {this.props.data.memory}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div>SWAP</div>
                            <div className={"serverstats-controls " + swapColorClass}>
                                {this.props.data.swap}
                                <sup>
                                    <span>%</span>
                                </sup>
                            </div>
                        </div>
                    </div>
                    <p className="card-text">
                        <strong>Čas od zapnutia:</strong> {this.props.data.uptime}
                        <br/>
                        <strong>Posledná záloha:</strong> {backuptime}
                        <br/>
                        <strong>Aktualizácie:</strong> <span
                        className={updatesColorClass}>{updates}({security_updates})</span>
                    </p>
                    <hr/>
                    <h5 className="card-title">Služby</h5>
                    <ul className="card-text list-unstyled centered-block">
                        {service_rows}
                    </ul>
                </div>
                <div className="card-footer text-muted">{time}</div>
            </div>
        </div>);
    }
}

module.exports = ServerStatsWidget;