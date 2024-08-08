import { useEffect, useState } from 'react';
import { ColorPicker } from './ColorPicker/ColorPicker';
import './LedControl.css';
import { Get, Post } from '../../Logik/Network';
import { EffectPicker } from './EffectPicker';
import { ColorPickerV2 } from './ColorPicker/ColorPickerV2';

export const LedControl = ({name, address}) => {
    const [value, setValue] = useState(null);
    const [effectSource, setEffectSource] = useState(["Effect 1", "Effect 2", "Effect 3", "Effect 4", "Effect 5", "Effect 6", "Effect 7", "Effect 8", "Effect 9", "Effect 1", "Effect 2", "Effect 3", "Effect 4", "Effect 5", "Effect 6", "Effect 7", "Effect 8", "Effect 9", "Effect 1", "Effect 2", "Effect 3", "Effect 4", "Effect 5", "Effect 6", "Effect 7", "Effect 8", "Effect 9"]);
    const [effect, setEffect] = useState(0);
    const [brightness, setBrightness] = useState(-1);

    useEffect(() => {
        if(address !== undefined && address !== null && address !== "") {
            getJsonValues();
        }        
    }, [address]);

    const getJsonValues = () => {
        Get(address + "/json", (res) => {
            console.log(res);
            setValue(res);
            setEffectSource(res.effects);
            if(res.state !== undefined){
                if(res.state.seg !== undefined) setEffect(res.state.seg[0].fx);
                if(res.state.bri !== undefined) setBrightness(res.state.bri);
            }            
        });
    };

    const setColor = (col) => {
        Post(address + "/json/state", {"seg": [{ "col": [col] }] }, (res) => {
            getJsonValues();
        });
    };

    const onChangeEffect = (val) => {
        setEffect(Number(val));
        Post(address + "/json/state", { "seg": [{ "fx": Number(val) }] }, (res) => {
            getJsonValues();
        });
    };

    const onChangeBrightness = (e) => {
        setBrightness(Number(e.target.value));
        Post(address + "/json/state", { "bri": Number(e.target.value) }, (res) => {
            getJsonValues();
        });
    };

    return (
        <div className="led-control">
            <div>
                <span>{name}</span>
                <ColorPicker name={name} color={value !== null && value.state !== undefined && value.state !== null && value.state.seg !== undefined && value.state.seg !== null ? value.state.seg[0].col[0] : [255, 0, 0]} setColor={setColor} onReload={getJsonValues}/>
            </div>
            <div>
                <EffectPicker effect={effect} source={effectSource} onPick={onChangeEffect} />
                <input type='range' min={1} max={255} value={brightness} onChange={onChangeBrightness} />
            </div>
        </div>
    )
};
/*
                <ColorPickerV2 color={value !== null ? value.state.seg[0].col[0] : [255, 0, 0]} setColor={setColor} />
 */