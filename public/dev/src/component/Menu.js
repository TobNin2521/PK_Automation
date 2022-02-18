import React from "react";

export default class Menu extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {    
        return (
            <div className="menu-containter">
                <div className="menu-item" onClick={ () => this.props.callback("lights") }>
                    Lights
                </div>
                <div className="menu-item" onClick={ () => this.props.callback("leds") }>
                    Leds
                </div>
            </div>
        );
    }
}