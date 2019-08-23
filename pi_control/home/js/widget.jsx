import React from 'react';

class Widget extends React.Component {
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

module.exports = Widget;
