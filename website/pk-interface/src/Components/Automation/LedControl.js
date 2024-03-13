import { useEffect, useState } from 'react';
import { ColorPicker } from './ColorPicker/ColorPicker';
import './LedControl.css';
import { Get, Post } from '../../Logik/Network';

export const LedControl = ({address}) => {
    const [value, setValue] = useState(null);
    const [effectSource, setEffectSource] = useState([]);
    const [effect, setEffect] = useState(-1);
    const [brightness, setBrightness] = useState(-1);

    useEffect(() => {
        if(address !== undefined && address !== null && address !== "") {
            Get(address + "/json", (res) => {
                setValue(res);
                setEffectSource(res.effects);
                setEffect(res.state.seg[0].fx);
                setBrightness(res.state.bri);
            });
        }
    }, [address]);

    const setColor = (col) => {
        console.log(col);
        Post(address + "/json/state", {"seg": [{ "col": [col] }] }, (res) => {
            
        });
    };

    const onChangeEffect = (e) => {
        setEffect(Number(e.target.value));
        Post(address + "/json/state", { "seg": [{ "fx": Number(e.target.value) }] }, (res) => {

        });
    };

    const onChangeBrightness = (e) => {
        setBrightness(Number(e.target.value));
        Post(address + "/json/state", { "bri": Number(e.target.value) }, (res) => {

        });
    };

    return (
        <div className="led-control">
            <ColorPicker color={value !== null ? value.state.seg[0].col[0] : [255, 0, 0]} setColor={setColor} />
            <select value={effect} onChange={onChangeEffect}>
                {effectSource.map((item, index) => {
                    return <option key={index} value={index}>{item}</option>
                })}
            </select>
            <input type='range' min={1} max={255} value={brightness} onChange={onChangeBrightness} />
        </div>
    )
};