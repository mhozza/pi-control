import * as React from 'react';

export class Widget extends React.Component {
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
