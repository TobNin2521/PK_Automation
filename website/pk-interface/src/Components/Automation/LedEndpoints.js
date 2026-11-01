import { useEffect, useState } from 'react';
import '../DmTools/DmTools.css';
import { GetLedEndpoints, SetLedEndpoint } from '../../Logik/Api';
import { KeybordComp } from '../Keyboard';

// Addresses of the LED devices (server/leds.js). Looks and works like the DM Tools card, so it shares its styles.
// The server only answers on its own display, anywhere else (a phone) the card stays hidden.
export const LedEndpoints = () => {
    const [endpoints, setEndpoints] = useState(null);
    const [open, setOpen] = useState(false);
    const [addresses, setAddresses] = useState({});
    const [focused, setFocused] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        GetLedEndpoints().then(e => { if(!cancelled) setEndpoints(e); }).catch(() => { if(!cancelled) setEndpoints(null); });
        return () => { cancelled = true; };
    }, []);

    if(endpoints === null) return null;

    const show = () => {
        let values = {};
        endpoints.forEach(e => { values[e.id] = e.address; });
        setAddresses(values);
        setError("");
        setOpen(true);
    };

    const close = () => {
        setOpen(false);
        setFocused(null);
    };

    const save = (id) => {
        setFocused(null);
        SetLedEndpoint(id, addresses[id].trim()).then(e => {
            setEndpoints(e);
            setAddresses(prev => ({ ...prev, [id]: e.find(x => x.id === id).address }));
            setError("");
        }).catch(err => {
            setError(err.response && err.response.data && err.response.data.message ? err.response.data.message : "Could not save the address");
        });
    };

    const keyboardPress = (key) => {
        if(key === '{⌨}') setFocused(null);
        if(key === '{enter}' && focused !== null) save(focused);
    };

    return (
        <>
            <div className="dmtools-card" onClick={show}>
                <div className="dmtools-title">LED Addresses</div>
                <div className="dmtools-state">{endpoints.length} devices</div>
            </div>
            {open === true ? (
                <div className={"dmtools-dialog" + (focused !== null ? " kbd-open" : "")}>
                    <div className="dmtools-header">
                        <div className="dmtools-heading">LED Addresses</div>
                        <div className="dmtools-close" onClick={close}>Close</div>
                    </div>
                    <div className="dmtools-body">
                        {endpoints.map(e => (
                            <div key={e.id}>
                                <div className="dmtools-label">{e.name}</div>
                                <div className="dmtools-row">
                                    <input className="dmtools-input" type="text" placeholder="http://192.168.x.x" value={addresses[e.id] || ""} onChange={(ev) => setAddresses({ ...addresses, [e.id]: ev.target.value })} onFocus={() => setFocused(e.id)} />
                                    <div className="dmtools-button" onClick={() => save(e.id)}>Save</div>
                                </div>
                            </div>
                        ))}
                        {error !== "" ? <div className="dmtools-error">{error}</div> : null}
                    </div>
                </div>
            ) : null}
            <KeybordComp showKeyboard={focused !== null} value={focused !== null ? addresses[focused] || "" : ""} setKeyboardValue={(v) => focused !== null && setAddresses(prev => ({ ...prev, [focused]: v }))} onKeyboardPress={keyboardPress} />
        </>
    );
};
