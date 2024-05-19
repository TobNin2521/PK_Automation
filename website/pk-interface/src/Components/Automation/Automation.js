import { Relay } from "./Relay";
import './Automation.css';
import { LedControl } from "./LedControl";

export const Automation = ({}) => {

    return (
        <div className="automation">
            <Relay name={"Bar Licht"} pin={33} />
            <Relay name={"1"} pin={40} />
            <Relay name={"Regale"} pin={35} />
            <Relay name={"Wand"} pin={37} />
            <Relay name={"Led Wand"} pin={38}>
                <LedControl />
            </Relay>
            <Relay name={"NOT WORKING"} pin={13}>
                <LedControl address={"http://bar.local"} />
            </Relay>
        </div>
    );
};