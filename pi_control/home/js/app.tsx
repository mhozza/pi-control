import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {TemperatureWidgetSet, TemperatureDetail} from './temperature';
import {PcStatusWidgetSet} from './pc_status';
import {PingWidget} from './network'
import {ServerStatsWidget} from './server_stats';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

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
        return <main>
            <Switch>
                <Route path="/" component={Widgets} exact />
                <Route path="/temperature/:id" component={TemperatureDetail} />
            </Switch>            
        </main>         
    }
}

ReactDOM.render(<BrowserRouter><App/></BrowserRouter>, document.getElementById('root'));
