import React from 'react';
import ReactDOM from 'react-dom';
import {TemperatureWidgetSet} from './temperature.jsx';
import {PcStatusWidgetSet} from './pc_status.tsx';
import {PingWidget} from './network.jsx'
import {ServerStatsWidget} from './server_stats.jsx';


class Widgets extends React.Component {
    render() {
        return <div className="row">
            <TemperatureWidgetSet/>
            <PcStatusWidgetSet/>
            <ServerStatsWidget/>
            <PingWidget/>
        </div>
    }
}

ReactDOM.render(<Widgets/>, document.getElementById('widgets'));
