import React, { createRef } from "react";
import "./Settings.css";

export default class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            toggled: false
        }
    }

    hideSettings = () => {
        this.setState({
            toggled: false
        });
    }

    showSettings = () => {
        this.setState({
            toggled: true
        });
    }

    render() {
        let settingsClasses =  this.state.toggled ? "settings-container settings-shown" : "settings-container settings-hidden"; 
        return (
            <div className={settingsClasses}>
            </div>
        );
    }
}