import { Children, useEffect, useState } from "react";
import ADDRESS, { Get, Post } from "../../Logik/Network";
import './Relay.css';

export const Relay = ({children, name, pin}) => {
    // Relays start switched off on the server, so assume off until the status arrives
    const [status, setStatus] = useState(false);
    
    useEffect(() => {
        try{
            Get(ADDRESS + "/relay/status?id=" + pin, (res) => {
                setStatus(res.status);
            });
        }
        catch(e){}
    }, []);

    //[33, 35, 38, 40, 37, 13]
    const switchOn = () => {
        Post(ADDRESS + "/relay", {
            id: pin,
            status: 1
        }, (res) => {
            if(res.result === "success") setStatus(true);
        });
    };

    const switchOff = () => {
        Post(ADDRESS + "/relay", {
            id: pin,
            status: 0
        }, (res) => {
            if (res.result === "success") setStatus(false);
        });
    };

    return (
        // Header is 3.5em, every child (LED control) is 8em, plus a little bottom space
        <div className={status === true ? "relay relay-on" : "relay"} style={{maxHeight: children !== undefined && status === true ? ((3.5 + Children.count(children) * 8 + 0.5) + "em") : ""}}>
            {/* The whole header is the touch target, not only the switch */}
            <div className="relay-header" onClick={status === true ? switchOff : switchOn}>
                <div className="relay-icon">
                    <svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
                </div>
                <div className="relay-title">
                    <span className="relay-name">{name}</span>
                    <span className="relay-status">{status === true ? "On" : "Off"}</span>
                </div>
                <div className={status === true ? "switch switch-on" : "switch"} role="switch" aria-checked={status === true}>
                    <div className="switch-knob"></div>
                </div>
            </div>
            {children}
        </div>
    );
};