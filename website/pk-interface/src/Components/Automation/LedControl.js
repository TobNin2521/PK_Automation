import { useEffect, useState } from 'react';
import { ColorPicker } from './ColorPicker/ColorPicker';
import './LedControl.css';
import { Get, Post } from '../../Logik/Network';
import { EffectPicker } from './EffectPicker';

export const LedControl = ({name, address}) => {
    const [value, setValue] = useState(null);
    const [effectSource, setEffectSource] = useState(["Effect 1", "Effect 2", "Effect 3", "Effect 4", "Effect 5", "Effect 6", "Effect 7", "Effect 8", "Effect 9"]);
    const [effect, setEffect] = useState(0);
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
        Post(address + "/json/state", {"seg": [{ "col": [col] }] }, (res) => {
            
        });
    };

    const onChangeEffect = (val) => {
        setEffect(Number(val));
        Post(address + "/json/state", { "seg": [{ "fx": Number(val) }] }, (res) => {

        });
    };

    const onChangeBrightness = (e) => {
        setBrightness(Number(e.target.value));
        Post(address + "/json/state", { "bri": Number(e.target.value) }, (res) => {

        });
    };

    return (
        <div className="led-control">
            <div>
                <span>{name}</span>
                <ColorPicker color={value !== null ? value.state.seg[0].col[0] : [255, 0, 0]} setColor={setColor} />
            </div>
            <div>
                <EffectPicker effect={effect} source={effectSource} onPick={onChangeEffect} />
                <input type='range' min={1} max={255} value={brightness} onChange={onChangeBrightness} />
            </div>
        </div>
    )
};