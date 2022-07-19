import React from "react";

export default class RgbLed extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            angle: (((Math.PI * 2) / this.props.count) * this.props.index)
        };
    }

    getPositionX = () => {
        return this.props.radius * Math.cos(this.state.angle) + (this.props.radius + 2);
    }
    
    getPositionY = () => {
        return this.props.radius * Math.sin(this.state.angle) + (this.props.radius + 2);
    }

    render() {  
        let styles = {
            led: {
                backgroundColor: "rgb(" + this.props.color[0] + ", " + this.props.color[1] + ", " + this.props.color[2] + ")",                
                filter: "drop-shadow(0 0 0.5vh rgb(" + this.props.color[0] + ", " + this.props.color[1] + ", " + this.props.color[2] + "))",
                left: this.getPositionX() + "vw",
                top: this.getPositionY() + "vw"
            }
        }
        return (
            <div className="rgb-led" style={styles.led}>
            </div>
        );
    }
}