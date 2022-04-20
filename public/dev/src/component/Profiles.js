import React from "react";
import "./Content.css";
import "./Profiles.css";

export default class Profiles extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            profiles: [],
            selectedProfile: "",
            newProfileName: ""
        }

        this.props.get(window.location.origin +  "/profiles", (response) => {
            this.setState({
                profiles: response
            });
        });
    }

    onSendConfig = (event) => {
        this.props.post(window.location.origin + "/profiles/set", { profile: this.state.selectedProfile });
    }

    onSaveCurrentConfig = (event) => {
        this.props.post(window.location.origin + "/profiles/savecurrent", { profileName: this.state.newProfileName });
    }

    onProfileSelectChange = (event) => {
        this.setState({
            selectedProfile: event.target.value
        });
    }

    onProfileNameChange = (event) => {
        this.setState({
            newProfileName: event.target.value
        });
    }
        
    render() {
        return (
            <div className="profiles-containter">
                <select onChange={this.onProfileSelectChange}>
                    {this.state.profiles.map((item, index) => {
                        return <option key={index} value={item}>{item.replace(".json", "")}</option>;
                    })}
                </select>
                <br/>
                <label>ProfileName: </label>
                <input onChange={this.onProfileNameChange} type="text" />
                <br/>
                <button onClick={this.onSendConfig}>Load selected profile</button>
                <br/>
                <button onClick={this.onSaveCurrentConfig}>Save current config as profile</button>
            </div>
        );
    }
}