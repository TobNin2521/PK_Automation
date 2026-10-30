import { useEffect, useState } from 'react';
import './DmTools.css';
import { GetDmTools, SetDmToolsUrl, ResetDmTools } from '../../Logik/Api';
import { KeybordComp } from '../Keyboard';

// Link to DM Tools (server/dmtools.js): shows the pairing code the game master types in DM Tools.
// The server only answers on its own display, anywhere else (a phone) the card stays hidden.
const POLL_MS = 3000;

const STATE_TEXT = {
    off: "Not set up",
    pairing: "Waiting for the code",
    linked: "Linked",
    offline: "Can't reach DM Tools"
};

export const DmTools = () => {
    const [status, setStatus] = useState(null);
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [showKeyboard, setShowKeyboard] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            GetDmTools().then(s => { if(!cancelled) setStatus(s); }).catch(() => { if(!cancelled) setStatus(null); });
        };
        load();
        const timer = setInterval(load, POLL_MS);
        return () => { cancelled = true; clearInterval(timer); };
    }, []);

    if(status === null) return null;

    const show = () => {
        setUrl(status.url || "");
        setError("");
        setOpen(true);
    };

    const close = () => {
        setOpen(false);
        setShowKeyboard(false);
    };

    const save = () => {
        setShowKeyboard(false);
        SetDmToolsUrl(url.trim()).then(s => {
            setStatus(s);
            setError("");
        }).catch(err => {
            setError(err.response && err.response.data && err.response.data.message ? err.response.data.message : "Could not save the address");
        });
    };

    const unlink = () => {
        ResetDmTools().then(() => GetDmTools()).then(s => {
            setStatus(s);
            setUrl("");
            setError("");
        }).catch(() => setError("Could not unlink"));
    };

    const keyboardPress = (key) => {
        if(key === '{⌨}') setShowKeyboard(false);
        if(key === '{enter}') save();
    };

    return (
        <>
            <div className="dmtools-card" onClick={show}>
                <div className="dmtools-title">DM Tools</div>
                <div className={"dmtools-state dmtools-state-" + status.state}>
                    {status.state === "pairing" && status.code ? status.code : STATE_TEXT[status.state]}
                </div>
            </div>
            {open === true ? (
                <div className={"dmtools-dialog" + (showKeyboard === true ? " kbd-open" : "")}>
                    <div className="dmtools-header">
                        <div className="dmtools-heading">DM Tools</div>
                        <div className="dmtools-close" onClick={close}>Close</div>
                    </div>
                    <div className="dmtools-body">
                        {showKeyboard === false ? (
                            <div className="dmtools-info">
                                {status.state === "pairing" && status.code ? (<>
                                    <div>Type this code in DM Tools under Settings, PK Automation, Add controller:</div>
                                    <div className="dmtools-code">{status.code}</div>
                                </>) : null}
                                {status.state === "pairing" && !status.code ? <div>Almost there, waiting for DM Tools...</div> : null}
                                {status.state === "linked" ? <div>This controller is linked to DM Tools. The game master can switch the profiles from there.</div> : null}
                                {status.state === "offline" ? <div>DM Tools can't be reached{status.error ? " (" + status.error + ")" : ""}. It keeps trying.</div> : null}
                                {status.state === "off" ? <div>Enter the address of DM Tools to link this controller.</div> : null}
                            </div>
                        ) : null}
                        <div className="dmtools-label">Address of DM Tools</div>
                        <div className="dmtools-row">
                            <input className="dmtools-input" type="text" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} onFocus={() => setShowKeyboard(true)} />
                            <div className="dmtools-button" onClick={save}>Save</div>
                            {status.url ? <div className="dmtools-button dmtools-button-quiet" onClick={unlink}>Unlink</div> : null}
                        </div>
                        {error !== "" ? <div className="dmtools-error">{error}</div> : null}
                    </div>
                </div>
            ) : null}
            <KeybordComp showKeyboard={showKeyboard} value={url} setKeyboardValue={setUrl} onKeyboardPress={keyboardPress} />
        </>
    );
};
