import * as React from "react";
import axios from 'axios';
import * as cookie from "cookie";
import { LoadingSpinner } from './loading';
import { Widget } from './widget';

const csrf_cookie = cookie.parse(document.cookie)['csrftoken'];

if (csrf_cookie) {
    axios.defaults.headers.post['X-CSRFToken'] = csrf_cookie;
}

interface PcStatusWidgetSetState {
    pcs: string[];
}

export class PcStatusWidgetSet extends Widget {
    state: PcStatusWidgetSetState = {
        pcs: null
    }

    tick() {
        let self = this;

        axios.get("/api/pc_status/list").then(response => {
            self.setState({ pcs: response.data });
        });
    }

    render() {
        if (this.state.pcs === null) {
            return <div className="col">
                <div className="card text-center">
                    <div className="card-header">PC</div>
                    <LoadingSpinner />
                </div>
            </div>
        }

        const widgets = this.state.pcs.map((pc, index) => <PcStatusWidget key={index} pc={pc} />);

        return <React.Fragment>
            {widgets}
        </React.Fragment>
    }
}

interface PcStatus {
    name: string;
    online: boolean;
    ssh: boolean;
    time: string;
}

interface PcStatusWidgetProps {
    pc: string;
}

interface PcStatusWidgetState {
    loading: boolean;
    data: PcStatus;
}

class PcStatusWidget extends Widget<PcStatusWidgetProps, PcStatusWidgetState> {
    state: PcStatusWidgetState = {
        loading: false,
        data: null,
    };

    constructor(props: PcStatusWidgetProps) {
        super(props);
        this.handleWakeupButtonClick = this.handleWakeupButtonClick.bind(this);
        this.handleSleepButtonClick = this.handleSleepButtonClick.bind(this);
        this.tick = this.tick.bind(this);
    }

    tick() {
        axios.get("/api/pc_status/status/" + this.props.pc).then(response => {
            this.setState({
                data: response.data,
                loading: false
            });
        });
    }

    handleWakeupButtonClick(event: React.MouseEvent) {
        axios.post("/api/pc_status/wakeup/" + this.state.data.name).then(response => {
            this.setState({ loading: true });
        });
    }

    handleSleepButtonClick(event: React.MouseEvent) {
        axios.post("/api/pc_status/sleep/" + this.state.data.name).then(response => {
            this.setState({ loading: true });
        });
    }

    render() {
        if (this.state.data === null) {
            return <div className="col-sm-6 col-md-4">
                <div className="card text-center">
                    <div className="card-header">PC</div>
                    <LoadingSpinner />
                </div>
            </div>
        }

        let time = new Date(this.state.data.time).toLocaleString();

        let button;
        if (this.state.data.online) {
            if (this.state.loading) {
                button = <button onClick={this.handleSleepButtonClick} className="btn btn-primary w-100">
                    <div className="spinner-border spinner-border-sm me-1" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    Uspávam...
                    </button>;
            } else {
                button = <button onClick={this.handleSleepButtonClick} className="btn btn-primary w-100">
                    Uspi</button>
            }
        } else {
            if (this.state.loading) {
                button = <button onClick={this.handleWakeupButtonClick} className="btn btn-primary w-100">
                    <div className="spinner-border spinner-border-sm me-1" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    Zapnínam...
                    </button>;
            } else {
                button = <button onClick={this.handleWakeupButtonClick} className="btn btn-primary w-100">
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
                        <br />
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
