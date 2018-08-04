import React from "react";
import axios from 'axios';
import cookie from "cookie";

// noinspection SpellCheckingInspection
const csrf_cookie = cookie.parse(document.cookie)['csrftoken'];

if (csrf_cookie) {
    axios.defaults.headers.post['X-CSRFToken'] = csrf_cookie;
}

class PcStatusWidget extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false
        };
        this.handleWakeupButtonClick = this.handleWakeupButtonClick.bind(this);
        this.handleSleepButtonClick = this.handleSleepButtonClick.bind(this);
    }

    handleWakeupButtonClick(event) {
        let self = this;
        axios.post("/api/pc_status/wakeup/").then(response => {
            console.log(self, this, event, response);
            self.setState({loading: true});
        });
    }

    handleSleepButtonClick(event) {
        let self = this;
        axios.post("/api/pc_status/sleep/").then(response => {
            console.log(self, this, event, response);
            self.setState({loading: true});
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.time !== this.props.time) {
            this.setState({loading: false});
        }
    }

    render() {
        let time = new Date(this.props.time).toLocaleString();

        let button;
        if (this.props.status) {
            if (this.state.loading) {
                button = <button onClick={this.handleSleepButtonClick} className="btn btn-primary btn-block">
                    <i className="fa fa-refresh fa-spin"/> Uspi</button>;
            } else {
                button = <button onClick={this.handleSleepButtonClick} className="btn btn-primary btn-block">
                    Uspi</button>
            }
        } else {
            if (this.state.loading) {
                button = <button onClick={this.handleWakeupButtonClick} className="btn btn-primary btn-block">
                    <i className="fa fa-refresh fa-spin"/> Zapni</button>;
            } else {
                button = <button onClick={this.handleWakeupButtonClick} className="btn btn-primary btn-block">
                    Zapni</button>
            }
        }

        return (<div className="col-sm-6 col-md-4">
            <div className="card text-center">
                <div className="card-header">{this.props.title}</div>
                <div className="card-body">
                    <p className="card-text">
                    <span className={"pc_status-widget-primary " + (this.props.status
                        ? "text-success"
                        : "text-danger")}>
                      {
                          this.props.status
                              ? "online"
                              : "offline"
                      }
                    </span>
                        <br/>
                        <span className="pc_status-widget-secondary">
                            <strong>SSH:</strong>&nbsp;
                        <span className={this.props.ssh
                            ? "text-success"
                            : "text-danger"}>
                          {
                              this.props.ssh
                                  ? "online"
                                  : "offline"
                          }
                        </span>
                    </span>
                    </p>
                    {button}
                </div>
                <div className="card-footer text-muted">{time}</div>
            </div>
        </div>);
    }
}

module.exports = PcStatusWidget;