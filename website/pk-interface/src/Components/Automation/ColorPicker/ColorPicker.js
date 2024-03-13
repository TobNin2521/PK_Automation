import { useEffect, useState } from 'react';
import './ColorPicker.css';

export const ColorPicker = ({style, color, setColor}) => {
    const [angle, setAngle] = useState(0);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        setAngle(getAngleFromColor(color));
    }, [color]);

    const getAngleFromColor = (color) => {
        let red = color[0], green = color[1], blue = color[2];
        if (red === 255) {
            if (green === 0 && blue === 0) return 0;
            if (blue === 0) {
                //0-60
                return (green / 255) * 60;
            }
            if (green === 0) {
                //300-360
                return (60 - ((blue / 255) * 60)) + 300;
            }
        }
        if (green === 255) {
            if (red === 0 && blue === 0) return 120;
            if (blue === 0) {
                //180-240
                return (60 - ((red / 255) * 60)) + 60;
            }
            if (red === 0) {
                //240-300
                return ((blue / 255) * 60) + 120;
            }
        }
        if (blue === 255) {
            if (red === 0 && green === 0) return 240;
            if (green === 0) {
                //120-180
                return ((red / 255) * 60) + 240;
            }
            if (red === 0) {
                //60-120
                return (60 - ((green / 255) * 60)) + 180;
            }
        }
        return 45;
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
        return [red, green, blue];
    };

    const onPalleteRotate = (e) => {
        if (dragging === true) {
            let box = document.querySelector(".color-selector-container");
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

    return (
        <div className="color-picker" style={style}>
            <div className="color-pallete">
                <div className='color-selector-container' style={{transform: 'rotate(' + angle + 'deg)'}} onTouchEnd={() => setDragging(false)} onMouseLeave={() => setDragging(false)} onMouseMove={onPalleteRotate} onTouchMove={onPalleteRotate}>
                    <div className='color-selector' onMouseDown={() => setDragging(true)} onMouseUp={() => setDragging(false)} onTouchEnd={() => setDragging(false)} onTouchStart={() => setDragging(true)}></div>
                </div>
            </div>            
            <div className="color-dot">

            </div>
        </div>
    );
};