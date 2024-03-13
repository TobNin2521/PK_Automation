import { useEffect, useState } from "react";
import { Get, Post } from "../../Logik/Network";
import './Relay.css';

export const Relay = ({children, name, pin}) => {
    const [status, setStatus] = useState(false);

    useEffect(() => {
        Get("http://192.168.178.47:8080/relay/status?id=" + pin, (res) => {
            setStatus(res.status);
        });
    }, []);

    //[33, 35, 38, 40, 37, 13]
    const switchOn = () => {
        Post("http://192.168.178.47:8080/relay", {
            id: pin,
            status: 1
        }, (res) => {
            if(res.result === "success") setStatus(true);
        });
    };

    const switchOff = () => {
        Post("http://192.168.178.47:8080/relay", {
            id: pin,
            status: 0
        }, (res) => {
            if (res.result === "success") setStatus(false);
        });
    };

    return (
        <div className="relay" style={{maxHeight: children !== undefined && status === true ? "16em" : ""}}>
            <div className="relay-header">
                <span>{name}</span>
                {status === true ? (
                    <svg viewBox="0 0 576 512" onClick={switchOff}>
                        <path className="fa-secondary" d="M192 64C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192s-86-192-192-192H192zm192 96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" />
                        <path className="fa-primary" d="M288 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0z" />
                    </svg>
                ) : (
                        <svg viewBox="0 0 576 512" onClick={switchOn}>
                        <path className="fa-secondary" d="M192 128c-70.7 0-128 57.3-128 128s57.3 128 128 128H384c70.7 0 128-57.3 128-128s-57.3-128-128-128H192zM384 64c106 0 192 86 192 192s-86 192-192 192H192C86 448 0 362 0 256S86 64 192 64H384z" />
                        <path className="fa-primary" d="M96 256a96 96 0 1 0 192 0A96 96 0 1 0 96 256z" />
                    </svg>
                )}
            </div>
            {children}
        </div>
    );
};