import React from "react";
import axios from 'axios';
import cookie from "cookie";
import LoadingSpinner from './loading.jsx';
import Widget from './widget.jsx'

const csrf_cookie = cookie.parse(document.cookie)['csrftoken'];

if (csrf_cookie) {
    axios.defaults.headers.post['X-CSRFToken'] = csrf_cookie;
}

async function getPcStatusData() {
    const pcs = (await axios.get("/api/pc_status/list")).data;
    console.log(pcs);

    return (await Promise.all(pcs.map(pc => axios.get("/api/pc_status/status/" + pc)))).map(response => response.data)
}


class PcStatusWidgetSet extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
        };
    }

    tick() {
        let self = this;

        getPcStatusData().then(response => {
            self.setState({data: response});
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

        const widgets = this.state.data.map((data, index) => <PcStatusWidget key={index} data={data}/>);

        return <React.Fragment>
            {widgets}
        </React.Fragment>
    }
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
        axios.post("/api/pc_status/wakeup/" + self.props.data.name).then(response => {
            console.log(self, this, event, response);
            self.setState({loading: true});
        });
    }

    handleSleepButtonClick(event) {
        let self = this;
        axios.post("/api/pc_status/sleep/" + self.props.data.name).then(response => {
            console.log(self, this, event, response);
            self.setState({loading: true});
        });
    }

    componentDidUpdate(prevProps) {
        if (this.props.data !== null && (prevProps.data === null || prevProps.data.time !== this.props.data.time)) {
            this.setState({loading: false});
        }
    }

    render() {
        if (this.props.data === null) {
            return <div className="col-sm-6 col-md-4">
                <div className="card text-center">
                    <div className="card-header">PC</div>
                    <LoadingSpinner/>
                </div>
            </div>
        }

        let time = new Date(this.props.data.time).toLocaleString();

        let button;
        if (this.props.data.online) {
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
                <div className="card-header">{this.props.data.name}</div>
                <div className="card-body">
                    <p className="card-text">
                    <span className={"pc_status-widget-primary " + (this.props.data.online
                        ? "text-success"
                        : "text-danger")}>
                      {
                          this.props.data.online
                              ? "online"
                              : "offline"
                      }
                    </span>
                        <br/>
                        <span className="pc_status-widget-secondary">
                            <strong>SSH:</strong>&nbsp;
                            <span className={this.props.data.ssh
                                ? "text-success"
                                : "text-danger"}>
                          {
                              this.props.data.ssh
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

module.exports = PcStatusWidgetSet;
