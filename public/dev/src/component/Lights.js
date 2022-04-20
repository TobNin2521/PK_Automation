import React from "react";
import "./Content.css";
import "./Lights.css";

/* API config 

  For Lights post:
  {
    id: <string>,                     //String describing the location of the strip (i.e. "bar", "walls", ...)
    state: <bool>                     //Boolean state of the light (true = on, false = off)
  }

*/

export default class Lights extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            lightId: "",
            state: false
        }
    }

    handleLightsIdChange = (event) => {
        this.setState({
            lightId: event.target.value
        });
    }

    handleLightsStateChange = (event) => {
        this.setState({
            state: event.target.value
        });
    }

    onSendConfig = (event) => {
        this.props.post(window.location.origin + "/lights", { id: this.state.lightId, state: this.state.state });
    }
        
    render() {
        return (
        <div className="lights-containter">
            <input type="text" placeholder="ID" id="light-id-input" onChange={this.handleLightsIdChange} />
            <br />
            <input type="checkbox" id="light-state-input" onChange={this.handleLightsStateChange} />
            <br />
            <button id="light-send-config" onClick={this.onSendConfig}>Send</button>
            <br />
            <span>//On-Off switch for each light</span>
        </div>
        );
    }
}