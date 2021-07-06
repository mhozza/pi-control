import * as React from "react";
import { Line } from 'react-chartjs-2';
import { LoadingSpinner } from './loading';
import { Widget } from './widget'
import axios from "axios";
import 'chartjs-adapter-date-fns';
import { ChartData, ChartOptions } from "chart.js";


const DISPLAY_FORMATS = {
    hour: 'HH:mm',
    minute: 'HH:mm',
    second: 'HH:mm:ss',
};

interface PingData {
    time: string;
    ping: number;
}

interface PingWidgetState {
    data: PingData[];
}

export class PingWidget extends Widget {
    state: PingWidgetState = {
        data: []
    };

    tick() {
        let self = this;

        axios.get("/api/network/list").then(response => {
            self.setState({ data: response.data });
        });
    }

    render() {
        let content;
        if (this.state.data.length === 0) {
            content = <LoadingSpinner />;
        } else {
            let labels = this.state.data.map(x => x.time);
            let ping_dataset = this.state.data.map(x => x.ping);

            let chartData: ChartData = {
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
            let chartOptions: ChartOptions = {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            tooltipFormat: 'HH:mm:ss',
                            displayFormats: DISPLAY_FORMATS,

                        },
                        ticks: {
                            source: 'data',
                            autoSkip: true
                        },
                        title: {
                            display: false,
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Ping (ms)'
                        },
                        beginAtZero: true,
                        suggestedMax: 50,
                    }

                }
            };
            content =
                <Line className="card-img-bottom" data={chartData} options={chartOptions} width={150} height={100} />;
        }

        return <div className="col">
            <div className="card">
                <div className="card-header text-center">Latencia siete</div>
                {content}
            </div>
        </div>;

    }
}
