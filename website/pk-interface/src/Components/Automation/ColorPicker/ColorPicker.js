import { useEffect, useState } from 'react';
import './ColorPicker.css';

export const ColorPicker = ({name, style, color, setColor, onReload}) => {
    const [angle, setAngle] = useState(0);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        setAngle(getAngleFromColor(color));
    }, [color]);

    // The picker only knows hues, any color (also one that was set by another device) is shown with its hue
    const getAngleFromColor = (color) => {
        const r = color[0] / 255, g = color[1] / 255, b = color[2] / 255;
        const max = Math.max(r, g, b), delta = max - Math.min(r, g, b);
        // White, grey and black have no hue
        if (delta === 0) return 0;
        let hue;
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue *= 60;
        return hue < 0 ? hue + 360 : hue;
    };

    const getColorFromAngle = (angle) => {
        let red = 0, green = 0, blue = 0;
        if (angle < 60) {
            //red to lila
            red = 255;
            green = (angle / 60) * 255;
        }
        else if (angle >= 60 && angle < 120) {
            //lila 60 to blue 120
            let tempAngle = angle - 60;
            red = 60 - tempAngle;
            red = (red / 60) * 255
            green = 255;
        }
        else if (angle >= 120 && angle < 180) {
            //blue to azure
            let tempAngle = angle - 120;
            blue = (tempAngle / 60) * 255
            green = 255;
        }
        else if (angle >= 180 && angle < 240) {
            //azure to green
            let tempAngle = angle - 180;
            green = 60 - tempAngle;
            green = (green / 60) * 255
            blue = 255;
        }
        else if (angle >= 240 && angle < 300) {
            //green to yellow
            let tempAngle = angle - 240;
            red = (tempAngle / 60) * 255
            blue = 255;
        }
        else if (angle >= 300) {
            //yellow to red
            let tempAngle = angle - 300;
            blue = 60 - tempAngle;
            blue = (blue / 60) * 255
            red = 255;
        }
        // WLED expects integer channel values
        return [Math.round(red), Math.round(green), Math.round(blue)];
    };

    const onPalleteRotate = (e) => {
        if (dragging === true) {
            let box = document.querySelector("#" + name + " .color-selector-container");
            let boxBoundingRect = box.getBoundingClientRect();
            let boxCenter = {
                x: boxBoundingRect.left + boxBoundingRect.width / 2,
                y: boxBoundingRect.top + boxBoundingRect.height / 2
            };
            let pX = e.pageX, pY = e.pageY;
            if (!pX || !pY) {
                pX = e.touches[0].pageX;
                pY = e.touches[0].pageY;
            }
            let angle = Math.atan2(pX - boxCenter.x, - (pY - boxCenter.y)) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            angle = angle % 360;
            setAngle(angle);
            setColor(getColorFromAngle(angle));
        }
    };

    const onPalleteClick = (e) => {
        let box = document.querySelector("#" + name + " .color-selector-container");
        let boxBoundingRect = box.getBoundingClientRect();
        let boxCenter = {
            x: boxBoundingRect.left + boxBoundingRect.width / 2,
            y: boxBoundingRect.top + boxBoundingRect.height / 2
        };
        let pX = e.pageX, pY = e.pageY;
        if (!pX || !pY) {
            pX = e.touches[0].pageX;
            pY = e.touches[0].pageY;
        }
        let angle = Math.atan2(pX - boxCenter.x, - (pY - boxCenter.y)) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        angle = angle % 360;
        setAngle(angle);
        setColor(getColorFromAngle(angle));
    };

    const IntArrToColor = (arr) => {
        return "rgb(" + arr[0] + "," + arr[1] + "," + arr[2] + ")";
    };

    return (
        <div id={name} className="color-picker" style={style}>
            <div className="color-pallete">
                <div className='color-selector-container' style={{transform: 'rotate(' + angle + 'deg)'}} onMouseDown={() => setDragging(true)} onTouchStart={() => setDragging(true)} onMouseUp={() => setDragging(false)} onTouchEnd={() => setDragging(false)} onMouseLeave={() => setDragging(false)} onMouseMove={onPalleteRotate} onTouchMove={onPalleteRotate} onClick={(e) => onPalleteClick(e)}>
                    <div className='color-selector' onMouseDown={() => setDragging(true)} onMouseUp={() => setDragging(false)} onTouchEnd={() => setDragging(false)} onTouchStart={() => setDragging(true)}></div>
                </div>
            </div>            
            <div className="color-dot" style={{backgroundColor: IntArrToColor(getColorFromAngle(angle))}} onClick={() => onReload()}>

            </div>
        </div>
    );
};