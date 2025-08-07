import { Relay } from "./Relay";
import './Automation.css';
import { LedControl } from "./LedControl";

export const Automation = ({}) => {

    return (
        <div className="automation">
            <Relay name={"Bar Licht"} pin={33} />
            <Relay name={"Led"} pin={35}>
                <LedControl name='Bar' address={"http://192.168.178.107"} />
                <LedControl name='Wand' address={"http://192.168.178.66"} />
            </Relay>
            <Relay name={"Regale"} pin={37} />
            <Relay name={"Wand"} pin={38} />
        </div>
    );
};

/*
            <Relay name={"NOT WORKING"} pin={13}/>
            <Relay name={"NOT WORKING"} pin={40} />
*/