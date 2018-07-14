import React from "react";


class ServerStatsWidget extends React.Component {
    render() {
        let time = new Date(this.props.time).toLocaleString();

        return (<div className="col-sm-6 col-md-4">
            <div className="card text-center">
                <div className="card-header">{this.props.title}</div>
                <div className="card-body">
                    <p className="card-text">
                        <strong>Up time:</strong> {this.props.uptime}
                    </p>
                </div>
                <div className="card-footer text-muted">{time}</div>
            </div>
        </div>);
    }
}

module.exports = ServerStatsWidget;