import React from "react";
import "./ColorPicker.css";

export default class ColorPicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedColor: props.color ? props.color : [
                255, 0, 0
            ],
            rotation: props.color ? this.getRotationFromColor(props.color) : 0,
            dragging: false,
            showPallate: false
        }
    }

    getRotationFromColor(color) {
        let red = color[0], green = color[1], blue = color[2];
        if(red == 255) {
            if(green == 0 && blue == 0) return 0;
            if(green == 0) {
                //0-60
                return (blue / 255) * 60;
            }
            if(blue == 0) {
                //300-360
                return (60- ((green / 255) * 60)) + 300;
            }
        }
        if(green == 255) {
            if(red == 0 && blue == 0) return 240;
            if(red == 0) {
                //180-240
                return (60 - ((blue / 255) * 60)) + 180;
            }
            if(blue == 0) {
                //240-300
                return ((red / 255) * 60) + 240;
            }
        }
        if(blue == 255) {
            if(red == 0 && green == 0) return 120;
            if(red == 0){
                //120-180
                return ((green / 255) * 60) + 120;
            }
            if(green == 0){
                //60-120
                return (60 - ((red / 255) * 60)) + 60;
            }
        }
        return 45;
    }

    getIntFromRgb(color) {
        return ((color[0] & 0xff) << 16) | ((color[1] & 0xff) << 8) | (color[2] & 0xff);
    }
    
    onPallateMouseDown = (e) => {
        if(e.target.className == "picker-selector"){
            let pX = e.pageX, pY = e.pageY;
            if(!pX || !pY) {
                pX = e.touches[0].pageX;
                pY = e.touches[0].pageY;
            }
            let angle = Math.atan2(pX - e.view.innerWidth, - (pY - e.view.innerHeight) )*(180 / Math.PI);   
            if(angle < 0) angle += 360;
            this.setState({
                dragging: true
            });
        }
    }

    onPallateMouseUp = (e) => {
        this.setState({
            dragging: false
        });
    }

    onPallateMouseMove = (e) => {
        if(this.state.dragging) {
            let box = document.querySelector(".picker-rotator");
            let boxBoundingRect = box.getBoundingClientRect();
            let boxCenter= {
                x: boxBoundingRect.left + boxBoundingRect.width/2, 
                y: boxBoundingRect.top + boxBoundingRect.height/2
            };
            let pX = e.pageX, pY = e.pageY;
            if(!pX || !pY) {
                pX = e.touches[0].pageX;
                pY = e.touches[0].pageY;
            }
            let angle = Math.atan2(pX - boxCenter.x, - (pY - boxCenter.y) )*(180 / Math.PI);   
            if(angle < 0) angle += 360;
            angle = angle % 360;

            //0°    red     [255, 0, 0]
            //60°   lila    [255, 0, 255]
            //120°  blue    [0, 0, 255]
            //180°  azure   [0, 255, 255]
            //240°  green   [0, 255, 0]
            //300°  yellow  [255, 255, 0]
            //360°  red     [255, 0, 0]
            let red = 0, green = 0, blue = 0;
            if(angle < 60) {
                //red to lila
                red = 255;
                blue = (angle / 60) * 255;
            }
            else if(angle >= 60 && angle < 120){
                //lila 60 to blue 120
                let tempAngle = angle - 60;
                red = 60 - tempAngle;
                red = (red / 60) * 255
                blue = 255;
            }
            else if(angle >= 120 && angle < 180){
                //blue to azure
                let tempAngle = angle - 120;
                green = (tempAngle / 60) * 255
                blue = 255;
            }
            else if(angle >= 180 && angle < 240){
                //azure to green
                let tempAngle = angle - 180;
                blue = 60 - tempAngle;
                blue = (blue / 60) * 255
                green = 255;
            }
            else if(angle >= 240 && angle < 300){
                //green to yellow
                let tempAngle = angle - 240;
                red = (tempAngle / 60) * 255
                green = 255;
            }
            else if(angle >= 300){
                //yellow to red
                let tempAngle = angle - 300;
                green = 60 - tempAngle;
                green = (green / 60) * 255
                red = 255;
            }

            this.setState({
                rotation: angle,
                selectedColor: [red, green, blue]
            });
        }
    }

    onPallateMouseLeave = (e) => {
        this.setState({
            dragging: false
        });
    }

    onTogglePallate = (e) => {
        this.setState({
            showPallate: !this.state.showPallate
        });
        if(this.state.showPallate && this.props.callback) {
            if(this.props.colorAsInt == true) {
                this.props.callback(this.getIntFromRgb(this.state.selectedColor));
            }
            else{
                this.props.callback(this.state.selectedColor);
            }
        } 
    }

    render() {    
        const styles = {
            picker: {
                height: this.props.size,
                width: this.props.size
            },
            selected: {
                backgroundColor: "rgb(" + this.state.selectedColor[0] + ", " + this.state.selectedColor[1] + ", " + this.state.selectedColor[2] + ")",
            },
            dragging: {
                backgroundColor: "#fff"//"rgb(" + this.state.selectedColor[0] + ", " + this.state.selectedColor[1] + ", " + this.state.selectedColor[2] + ")"
            },
            button: {
                backgroundColor: "rgb(" + this.state.selectedColor[0] + ", " + this.state.selectedColor[1] + ", " + this.state.selectedColor[2] + ")"
            },
            rotator: {
                transform: "rotate(" + this.state.rotation + "deg)"
            }
        };
        return (
            <div className="color-picker" style={styles.picker}>
                <div className="picker-selected" style={styles.selected} onClick={this.onTogglePallate}></div>
                { this.state.showPallate ? 
                <div className="picker-container">
                    <div className="picker-overlay" onClick={this.onTogglePallate}></div>  
                    <div>                  
                        <div className="picker-pallate">
                            <div className="picker-rotator" style={styles.rotator}
                             onMouseLeave={this.onPallateMouseLeave} onMouseMove={this.onPallateMouseMove} onMouseDown={this.onPallateMouseDown} onMouseUp={this.onPallateMouseUp}
                             onTouchStart={this.onPallateMouseDown} onTouchEnd={this.onPallateMouseUp} onTouchMove={this.onPallateMouseMove}>
                                <div className="picker-selector" style={styles.dragging}></div>
                            </div>
                        </div>
                        <div className="picker-button" style={styles.button} onClick={this.onTogglePallate}></div>
                    </div>
                </div> : null }
            </div>
        );
    }
}

/*

                { this.state.showPallate == true ? <div className="picker-pallate" style={styles.pallate} onMouseDown={this.onPallateMouseDown} onMouseUp={this.onPallateMouseUp} onMouseLeave={this.onPallateMouseLeave} onMouseMove={this.onPallateMouseMove}>
                </div> : null }
                <div className="picker-indicator">
                    { this.state.showPallate == true ? <div className="picker-selector"></div> : null }
                    <div className="picker-selected" style={styles.selected} onClick={this.onTogglePallate}></div>
                </div>

*/