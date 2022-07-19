import React, { createRef } from "react";
import "./ElementDetail.css";
import LedStrip from "./LedStrip";
import ColorPicker from "./ColorPicker"

export default class ElementDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedStatus: true,
            selectedAnimation: "rainbow",
            selectedColor: [255, 0, 0],
            selectedColorAlt: [0, 0, 255],
            selectedBrightness: 100
        };
        let apiPath = this.props.item.type == "LED" ? "/leds/config_by_id?led=" : "/lights/config_by_id?light=";
        this.props.get(window.location.origin +  apiPath + this.props.item.apiKey, (response) => {
            if(response) {
                if(this.props.item.type == "LED") {
                    this.setState({
                        selectedStatus: response["status"],
                        selectedAnimation: response["animation"],
                        selectedColor: response["animationValue"],
                        selectedColorAlt: response["animationValueAlt"],
                        selectedBrightness: response["brightness"]
                    });
                }
                else {
                    this.setState({
                        selectedStatus: response["status"]
                    });
                }
            }
        });
        this.stripRef = createRef();
    }

    onColorSelect = (color) => {
        this.setState({
            selectedColor: color
        });
    }
    
    onColorAltSelect = (color) => {
        this.setState({
            selectedColorAlt: color
        });
    }

    onAnimationSelect = (e) => {
        this.setState({
            selectedAnimation: e.target.value
        });
        this.stripRef.current.setAnimation(e.target.value);
    }

    onBrightnessChange = (e) => {
        this.setState({
            selectedBrightness: e.target.value
        });
    }

    onStatusChange = (e) => {
        this.setState({
            selectedStatus: e.target.checked
        });
    }

    onSaveElement = () => {
        let apiPath = this.props.item.type == "LED" ? "/leds" : "/lights";
        let data = {
            id: this.props.item.apiKey,
            status: this.state.selectedStatus
        };
        if(this.props.item.type == "LED") {
            data["animation"] = this.state.selectedAnimation;
            data["animationValue"] = this.getIntFromRgb(this.state.selectedColor);
            data["animationValueAlt"] = this.getIntFromRgb(this.state.selectedColorAlt);
            data["brightness"] = this.state.selectedBrightness;
        }
        this.props.post(window.location.origin +  apiPath, data);
        this.props.closeDetails();
    }

    
    getIntFromRgb = (color) => {
        return ((color[0] & 0xff) << 16) | ((color[1] & 0xff) << 8) | (color[2] & 0xff);
    }

    render() {  
        return (
            <div className="element-detail">
                <div className="element-name">{ this.props.item.name }</div>
                <br />
                {
                    this.props.item.type == "LED" ? (
                        <div>
                            <div>Status: <input type="checkbox" onChange={this.onStatusChange} checked={this.state.selectedStatus}/></div>
                            <div>Animation: 
                                <select onChange={this.onAnimationSelect} value={this.state.selectedAnimation}>
                                    <option value="solid">Solid</option>
                                    <option value="fade">Fade</option>
                                    <option value="rainbow">Rainbow</option>
                                    <option value="theater">Theater</option>
                                    <option value="meteor">Meteor</option>
                                    <option value="fire">Fire</option>
                                </select>
                            </div>
                            <div>Color #1: <ColorPicker size="25px" color={this.state.selectedColor} callback={this.onColorSelect} colorAsInt={false} /></div>
                            <div>Color #2: <ColorPicker size="25px" color={this.state.selectedColorAlt} callback={this.onColorAltSelect} colorAsInt={false} /></div>
                            <div>Brightness: <input type="range" value={this.state.selectedBrightness} onChange={this.onBrightnessChange} step="5" min="0" max="255"/></div>

                            <LedStrip ref={this.stripRef} count={40} radius={15} animation={this.state.selectedAnimation} color={this.state.selectedColor} colorAlt={this.state.selectedColorAlt} />
                        </div>
                    ) : (
                        <div>
                            <div>Status: <input type="checkbox" onChange={this.onStatusChange} checked={this.state.selectedStatus}/></div>
                        </div>
                    )
                }
                <div className="element-save" onClick={this.onSaveElement}>Save</div>
            </div>
        );
    }
}