import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {TemperatureWidgetSet} from './temperature';
import {PcStatusWidgetSet} from './pc_status';
import {PingWidget} from './network'
import {ServerStatsWidget} from './server_stats';


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

class App extends React.Component {
    render() {
        return <Widgets/>
    }
}

ReactDOM.render(<App/>, document.getElementById('root'));
