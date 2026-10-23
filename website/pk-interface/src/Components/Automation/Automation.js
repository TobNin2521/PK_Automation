import { Relay } from "./Relay";
import './Automation.css';
import { LedControl } from "./LedControl";

export const Automation = ({}) => {

    return (
        <div className="automation">
            <Relay name={"Bar Licht"} pin={33} />
            <Relay name={"Led"} pin={35}>
                {/* The ids and the addresses of the LED devices are configured in server/leds.js */}
                <LedControl id='bar' name='Bar' />
                <LedControl id='wand' name='Wand' />
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