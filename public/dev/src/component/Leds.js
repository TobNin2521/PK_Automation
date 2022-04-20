import React from "react";
import "./Content.css";
import "./Leds.css";

/* API config 

  For LED post:
  {
    id: <string>,                     //String describing the location of the strip (i.e. "bar", "walls", ...)
    animation: <string>,              //Animation name. Currently implemented: rainbow, solid, fade, dance, twinkle
    animationValue: <int>,            //Only for animiations solid and fade: int representation of color value (for solid this describes the one color displayed, for fade this is one of the colors between the strip fades)
    animationValueAlt: <int>          //Only for animiation fade: int representation of color value (second fade color)
  }

*/

export default class Leds extends React.Component {
    constructor(props) {
        super(props);        
        this.state = {
            brightness: 100,
            ledId: "",
            animation: "",
            colorOne: 0,
            colorTwo: 0
        }
    }
    
    handleBrightnessChange = (event) => {
        this.setState({
            brightness: Number(event.target.value)
        });
    }

    handleLedIdChange = (event) => {
        this.setState({
            ledId: event.target.value
        });
    }

    handleAnimationChange = (event) => {
        this.setState({
            animation: event.target.value
        });
    }

    handleColorOneChange = (event) => {
        this.setState({
            colorTwo: parseInt(event.target.value.replace("#", "0x"))
        });

    }

    handleColorTwoChange = (event) => {
        this.setState({
            colorOne: parseInt(event.target.value.replace("#", "0x"))
        });
    }

    onSendConfig = (event) => {
        this.props.post(window.location.origin + "/leds", { id: this.state.ledId, animation: this.state.animation, animationValue: this.state.colorOne, animationValueAlt: this.state.colorTwo });
        this.props.post(window.location.origin + "/brightness", { brightness: Number(this.state.brightness) });
    }

    render() {
        return (
            <div className="leds-containter">
                <div className="brigthness-container">
                    <span>Brightness slider 0-255</span>
                    <input id="led-brightness" type="range" min="0" max="255" value={this.state.brightness} onChange={this.handleBrightnessChange} step="1"/>
                </div>
                <div className="animation-config-container">
                    <input type="text" placeholder="ID" id="led-id-input" onChange={this.handleLedIdChange} /><span>  bar / walls / billard / glasses / door</span>
                    <br/>
                    <select id="led-animation-select" onChange={this.handleAnimationChange}>
                        <option value="rainbow">Rainbow</option>
                        <option value="solid">Solid</option>
                        <option value="fade">Fade</option>
                        <option value="dance">Dance</option>
                        <option value="twinkle">Twinkle</option>
                    </select>
                    <br/>
                    <input type="color" id="led-color-one-input" onChange={this.handleColorOneChange} />
                    <br/>
                    <input type="color" id="led-color-two-input" onChange={this.handleColorTwoChange} />
                    <br/>
                    <button id="led-send-config" onClick={this.onSendConfig}>Send</button>
                    <br/>
                    <span>//Animation and color selection for strips</span>
                </div>
            </div>
        );
    }
}