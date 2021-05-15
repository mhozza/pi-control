import React from "react";
import axios from 'axios';
import cookie from "cookie";
import {LoadingSpinner} from './loading.jsx';
import {Widget} from './widget.tsx'

const csrf_cookie = cookie.parse(document.cookie)['csrftoken'];

if (csrf_cookie) {
    axios.defaults.headers.post['X-CSRFToken'] = csrf_cookie;
}

export class PcStatusWidgetSet extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            pcs: null,
        };
    }

    tick() {
        let self = this;

        axios.get("/api/pc_status/list").then(response => {
            self.setState({pcs: response.data});
        });
    }

    render() {
        if (this.state.pcs === null) {
            return <div className="col-sm-6 col-md-4">
                <div className="card text-center">
                    <div className="card-header">PC</div>
                    <LoadingSpinner/>
                </div>
            </div>
        }

        const widgets = this.state.pcs.map((pc, index) => <PcStatusWidget key={index} pc={pc}/>);

        return <React.Fragment>
            {widgets}
        </React.Fragment>
    }
}

class PcStatusWidget extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            data: null,
        };
        this.handleWakeupButtonClick = this.handleWakeupButtonClick.bind(this);
        this.handleSleepButtonClick = this.handleSleepButtonClick.bind(this);
    }

    tick() {
        let self = this;
        axios.get("/api/pc_status/status/" + self.props.pc).then(response => {
            self.setState({
                data: response.data,
                loading: false
            });
        });
    }

    handleWakeupButtonClick(event) {
        let self = this;
        axios.post("/api/pc_status/wakeup/" + self.state.data.name).then(response => {
            console.log(self, this, event, response);
            self.setState({loading: true});
        });
    }

    handleSleepButtonClick(event) {
        let self = this;
        axios.post("/api/pc_status/sleep/" + self.state.data.name).then(response => {
            console.log(self, this, event, response);
            self.setState({loading: true});
        });
    }

    render() {
        if (this.state.data === null) {
            return <div className="col-sm-6 col-md-4">
                <div className="card text-center">
                    <div className="card-header">PC</div>
                    <LoadingSpinner/>
                </div>
            </div>
        }

        let time = new Date(this.state.data.time).toLocaleString();

        let button;
        if (this.state.data.online) {
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
                <div className="card-header">{this.state.data.name}</div>
                <div className="card-body">
                    <p className="card-text">
                    <span className={"pc_status-widget-primary " + (this.state.data.online
                        ? "text-success"
                        : "text-danger")}>
                      {
                          this.state.data.online
                              ? "online"
                              : "offline"
                      }
                    </span>
                        <br/>
                        <span className="pc_status-widget-secondary">
                            <strong>SSH:</strong>&nbsp;
                            <span className={this.state.data.ssh
                                ? "text-success"
                                : "text-danger"}>
                          {
                              this.state.data.ssh
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
