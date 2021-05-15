import * as React from 'react';

export class Widget<P = {}, S = {}, SS = any> extends React.Component<P, S, SS> {
    timerID: NodeJS.Timeout;

    componentDidMount() {
        this.tick();
        this.timerID = setInterval(() => this.tick(), 15000);
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    tick() {
    }
}
