import React from "react";


class ServerStatsWidget extends React.Component {
    render() {
        let time = new Date(this.props.time).toLocaleString();
        let backuptime = new Date(this.props.backuptime).toLocaleString();

        return (<div className="col-sm-6 col-md-4">
            <div className="card text-center">
                <div className="card-header">{this.props.title}</div>
                <div className="card-body">
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