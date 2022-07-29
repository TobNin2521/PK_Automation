import React from "react";
import "./SpectrumPicker.css";

export default class SpectrumPicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedSpectrum: this.props.spectrum ? this.props.spectrum : [255, 0, 0]
        };
    }

    onSelectSpectrum = (spectrum) => {
        this.setState({
            selectedSpectrum: spectrum
        });
        this.props.onSpectrumChange(spectrum);
    }

    render() {
        let classRed = "spectrum spectrum-red" + (this.state.selectedSpectrum[0] == 255 ? " selected" : "");
        let classGreen = "spectrum spectrum-green" + (this.state.selectedSpectrum[1] == 255 ? " selected" : "");
        let classBlue = "spectrum spectrum-blue" + (this.state.selectedSpectrum[2] == 255 ? " selected" : "");
        return (
            <div className="spectrum-picker-container">
                <span className={classRed} onClick={() => this.onSelectSpectrum([255, 0, 0])}></span>
                <span className={classGreen} onClick={() => this.onSelectSpectrum([0, 255, 0])}></span>
                <span className={classBlue} onClick={() => this.onSelectSpectrum([0, 0, 255])}></span>
            </div>
        );
    }
}