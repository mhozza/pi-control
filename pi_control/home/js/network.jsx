import React from "react";
import {Line} from 'react-chartjs-2';
import {LoadingSpinner} from './loading.tsx';
import {Widget} from './widget.tsx'
import axios from "axios";


const DISPLAY_FORMATS = {
    hour: 'HH:mm',
    minute: 'HH:mm',
    second: 'HH:mm:ss',
};


export class PingWidget extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
        };
    }

    tick() {
        let self = this;

        axios.get("/api/network/list").then(response => {
            self.setState({data: response.data});
        });
    }

    render() {
        let content;
        if (this.state.data.length === 0) {
            content = <LoadingSpinner/>;
        } else {
            let labels = this.state.data.map(x => x.time);
            let ping_dataset = this.state.data.map(x => x.ping);

            let chartData = {
                labels: labels,
                datasets: [
                    {
                        label: 'Ping latencia',
                        data: ping_dataset,
                        borderColor: 'rgba(128, 128, 128, .8)',
                        pointRadius: 3,
                        fill: false,
                        cubicInterpolationMode: 'monotone'
                    }
                ]
            };
            let chartOptions = {
                responsive: true,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            tooltipFormat: 'HH:mm:ss',
                            displayFormats: DISPLAY_FORMATS,

                        },
                        ticks: {
                            source: 'data',
                            autoSkip: true
                        },
                        scaleLabel: {
                            display: false,
                        }
                    }],

                    yAxes: [
                        {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            scaleLabel: {
                                display: true,
                                labelString: 'Ping (ms)'
                            },
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: 50
                            }
                        }
                    ]
                }
            };
            content =
                <Line className="card-img-bottom" data={chartData} options={chartOptions} width={150} height={100}/>;
        }

        return <div className="col-md-4">
            <div className="card">
                <div className="card-header text-center">Latencia siete</div>
                {content}
            </div>
        </div>;

    }
}
