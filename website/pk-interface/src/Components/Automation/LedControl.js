import { useEffect, useRef, useState } from 'react';
import { ColorPicker } from './ColorPicker/ColorPicker';
import './LedControl.css';
import { GetLed, SetLed } from '../../Logik/Api';
import { Subscribe } from '../../Logik/Server';
import { EffectPicker } from './EffectPicker';

// Stable references, a new array on every render would re-trigger the ColorPicker effect
const DEFAULT_COLOR = [255, 0, 0];
const NO_EFFECTS = [];

// The LED device itself is handled by the server (server/leds.js), id is the id of the device there
export const LedControl = ({id, name}) => {
    const [led, setLed] = useState(null);
    const [offline, setOffline] = useState(false);
    const [effect, setEffect] = useState(0);
    const [brightness, setBrightness] = useState(-1);
    // Sliders send a lot of changes: one request at a time, the changes in the meantime are merged
    const inflight = useRef(false);
    const pending = useRef(null);

    useEffect(() => {
        loadLed();
        // Changes made by other devices
        return Subscribe("led", (state) => {
            if(state.id === id && inflight.current === false && pending.current === null) setLed(state);
        });
    }, [id]);

    useEffect(() => {
        if(led !== null) {
            setEffect(led.effect);
            setBrightness(led.brightness);
        }
    }, [led]);

    const loadLed = () => {
        GetLed(id).then((state) => {
            setOffline(false);
            setLed(state);
        }).catch((err) => {
            console.log(err);
            setOffline(true);
        });
    };

    const sendChange = (change) => {
        pending.current = {...(pending.current || {}), ...change};
        if(inflight.current === false) flush();
    };

    const flush = () => {
        const change = pending.current;
        pending.current = null;
        inflight.current = true;
        SetLed(id, change).then((state) => {
            setOffline(false);
            // Not while the user is still moving a slider, that would snap it back
            if(pending.current === null) setLed(state);
        }).catch((err) => {
            console.log(err);
            setOffline(true);
        }).finally(() => {
            inflight.current = false;
            if(pending.current !== null) flush();
        });
    };

    const setColor = (col) => {
        sendChange({ color: col });
    };

    const onChangeEffect = (val) => {
        setEffect(Number(val));
        sendChange({ effect: Number(val) });
    };

    const onChangeBrightness = (e) => {
        setBrightness(Number(e.target.value));
        sendChange({ brightness: Number(e.target.value) });
    };

    return (
        <div className={offline === true ? "led-control led-offline" : "led-control"}>
            <div className="led-wheel">
                <ColorPicker name={name} color={led !== null ? led.color : DEFAULT_COLOR} setColor={setColor} onReload={loadLed}/>
            </div>
            <div className="led-settings">
                <span className="led-name">{name}</span>
                <EffectPicker effect={effect} source={led !== null ? led.effects : NO_EFFECTS} onPick={onChangeEffect} />
                <span className="led-brightness-label">Brightness</span>
                <input type='range' min={1} max={255} value={brightness} style={{"--fill": (Math.max(brightness - 1, 0) / 254 * 100) + "%"}} onChange={onChangeBrightness} />
            </div>
        </div>
    )
};
