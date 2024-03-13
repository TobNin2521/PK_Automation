import { Relay } from "./Relay";
import './Automation.css';
import { LedControl } from "./LedControl";

export const Automation = ({}) => {

    return (
        <div className="automation">
            <Relay name={"Bar Licht"} pin={33} />
            <Relay name={"1"} pin={40} />
            <Relay name={"2"} pin={35} />
            <Relay name={"3"} pin={37} />
            <Relay name={"Led Bar"} pin={13}>
                <LedControl address={"http://bar.local"} />
            </Relay>
            <Relay name={"Led Wand"} pin={38}>
                <LedControl />
            </Relay>
        </div>
    );
};