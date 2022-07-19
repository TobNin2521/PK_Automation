import React from "react";
import "./LedStrip.css";
import RgbLed from "./RgbLed";

export default class LedStrip extends React.Component {
    constructor(props) {
        super(props);
        let strip = {};
        for(let i = 0; i < this.props.count; i++) {
            strip["led" + i] = [255, 255, 255];
        }
        this.animation = this.props.animation;
        strip["rainbowIndex"] = 0;
        strip["fadeDirection"] = true;
        strip["meteorIndex"] = 0;
        this.state = strip;
    }

    componentWillMount() {
        this.runStrip();
    }
  
    animation = "rainbow"

    setPixel = (i, color) => {
        let pixel = {};
        pixel["led"+ i] = color;
        this.setState(pixel);
    }

    setAnimation = (effect) => {
        this.animation = effect;
    }

    runStrip = () => {
        if(this.animation == "rainbow") {
            this.rainbow();
        }
        if(this.animation == "theater") {
            this.theater(0, 0);
        }
        if(this.animation == "solid") {
            this.solid();
        }
        if(this.animation == "fade") {
            this.fade(0);
        }
        if(this.animation == "meteor") {
            this.meteorRain(10, 64, true);
        }
        if(this.animation == "fire") {
            this.fire(55, 120);
        }
    }

    Wheel = (WheelPos) => {        
        let c = [0, 0, 0];
        if (WheelPos < 85)
        {
            c[0] = WheelPos * 3;
            c[1] = 255 - WheelPos * 3;
            c[2] = 0;
        }
        else if (WheelPos < 170)
        {
            WheelPos -= 85;
            c[0] = 255 - WheelPos * 3;
            c[1] = 0;
            c[2] = WheelPos * 3;
        }
        else
        {
            WheelPos -= 170;
            c[0] = 0;
            c[1] = WheelPos * 3;
            c[2] = 255 - WheelPos * 3;
        }
        return c;
    }

    rainbow = () => {
        for (let i = 0; i < this.props.count; i++)
        {
            let c = this.Wheel(((i * 256 / this.props.count) + this.state.rainbowIndex) & 255);
            this.setPixel(i, c);
        }    

        this.state.rainbowIndex = (this.state.rainbowIndex + 1) % (256 * 4);
        setTimeout(this.runStrip, 20);
    }

    theater = (j, q) => {
        if(this.animation != "theater") {
            this.runStrip();
            return;
        }
        for (let i=0; i < this.props.count; i=i+3) {
          let c = this.Wheel( (i+j) % 255);
          this.setPixel(i+q, c); 
        }
        setTimeout(() => { 
            for (let i=0; i < this.props.count; i=i+3) {
              this.setPixel(i+q, [0, 0, 0]);
            }
            q = (q + 1) % 3;
            if(q == 2){
                j = (j + 1) % 256;
            }
            this.theater(j, q);
        }, 50);
    }

    solid = () => {
        for (let i = 0; i < this.props.count; i++)
        {
            this.setPixel(i, this.props.color);
        }    
        setTimeout(this.runStrip, 1500);
    }

    fade = (fadeIndex) => {
        if(this.animation != "fade") {
            this.runStrip();
            return;
        }
        let fadeColor1 = this.props.color;
        let fadeColor2 = this.props.colorAlt;
        if(!this.state.fadeDirection) {
            fadeColor1 = this.props.colorAlt;
            fadeColor2 = this.props.color;
        }
        let rgb1 = fadeColor1;
        let rgb2 = fadeColor2;
        
        let r = ((rgb1[0] * (255 - fadeIndex)) + (rgb2[0] * fadeIndex)) / 255;
        let g = ((rgb1[1] * (255 - fadeIndex)) + (rgb2[1] * fadeIndex)) / 255;
        let b = ((rgb1[2] * (255 - fadeIndex)) + (rgb2[2] * fadeIndex)) / 255;
    
        if(fadeIndex == 255) this.state.fadeDirection = !this.state.fadeDirection;
        fadeIndex = (fadeIndex + 1) % 256;
    
        for (let i = 0; i < this.props.count; i++)
        {
            this.setPixel(i, [r, g, b]);
        }    
        setTimeout(() => {
            this.fade(fadeIndex);
        }, 25);
    }

    meteorRain = (meteorSize, meteorTrailDecay, meteorRandomDecay) => {
        if(this.animation != "meteor") {
            this.runStrip();
            return;
        }
        if(this.state.meteorIndex == 0) {
            for (let i = 0; i < this.props.count; i++)
            {
                this.setPixel(i, [0, 0, 0]);
            }    
        }
        let rgb = this.props.color;
        for (let j = 0; j < this.props.count; j++)
        {
            if ((!meteorRandomDecay) || (Math.floor(Math.random() * 10) > 5))
            {               
                let oldColor = this.state["led" + j];
                let r = oldColor[0];
                let g = oldColor[1];
                let b = oldColor[2];
            
                r = (r <= 10) ? 0 : r - (r * meteorTrailDecay / 256);
                g = (g <= 10) ? 0 : g - (g * meteorTrailDecay / 256);
                b = (b <= 10) ? 0 : b - (b * meteorTrailDecay / 256);
               
                this.setPixel(j, [r, g, b]);
            }
        }
    
        for (let j = 0; j < meteorSize; j++)
        {
            if ((this.state.meteorIndex - j <  this.props.count) && (this.state.meteorIndex - j >= 0))
            {
                this.setPixel(this.state.meteorIndex - j, rgb);
            }
        }
    
        this.state.meteorIndex = (this.state.meteorIndex + 1) % (this.props.count + this.props.count);
        setTimeout(() => {
            this.meteorRain(meteorSize, meteorTrailDecay, meteorRandomDecay);
        }, 30);
    }

    fire = (Cooling, Sparking, heat) => {
        if(this.animation != "fire") {
            this.runStrip();
            return;
        }
        if(!heat){
            heat = [];
            for(let i = 0; i < this.props.count; i++){
                heat.push(0);
            }
        }
        let cooldown;
    
        for (let i = 0; i < this.props.count; i++)
        {
            cooldown = Math.floor(Math.random() * ((Cooling * 10) / this.props.count) + 2);
    
            if (cooldown > heat[i])
            {
                heat[i] = 0;
            }
            else
            {
                heat[i] = heat[i] - cooldown;
            }
        }
    
        for (let k = this.props.count - 1; k >= 2; k--)
        {
            heat[k] = (heat[k - 1] + heat[k - 2] + heat[k - 2]) / 3;
        }
    
        if (Math.floor(Math.random() * 255) < Sparking)
        {
            let y = Math.floor(Math.random() * 7);
            heat[y] = heat[y] + (Math.floor(Math.random() * 95) + 160);
        }
    
        for (let j = 0; j < this.props.count; j++)
        {
            let t192 = Math.round((heat[j] / 255.0) * 191);
        
            let heatramp = t192 & 0x3F;
            heatramp <<= 2;
        
            if (t192 > 0x80)
            {
                this.setPixel(j, [255, 255, heatramp]);
            }
            else if (t192 > 0x40)
            { 
                this.setPixel(j, [255, heatramp, 0]);
            }
            else
            { 
                this.setPixel(j, [heatramp, 0, 0]);
            }
        }
    
        setTimeout(() => {
            this.fire(Cooling, Sparking, heat);
        }, 15);
    }

    render() {  
        let ledElements = [];
        for(let i = 0; i < this.props.count; i++) {
            ledElements.push(<RgbLed color={this.state["led" + i]} index={i} count={this.props.count} key={i} radius={this.props.radius} />);
        }
        const styles = {
            ledContainer: {
                width: ((this.props.radius * 2) + 4) + "vw",
                height: ((this.props.radius * 2) + 4) + "vw",
                marginLeft: ((46 - ((this.props.radius * 2) + 4)) / 2) + "vw"
            }
        };
        return (
            <div className="led-strip-container" style={styles.ledContainer}>
                {ledElements}
            </div>
        );
    }
}