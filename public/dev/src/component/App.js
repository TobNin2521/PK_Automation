import React, { Profiler } from "react";
import Leds from "./Leds";
import Lights from "./Lights";
import Profiles from "./Profiles";
import Menu from "./Menu";
import "./App.css";

export default class App extends React.Component {
  state = {
    selectedMenu: "lights"
  };

  onMenuItemSelected = (menuName) => {
    this.setState({
      selectedMenu: menuName
    });
  };
  

  apiPost = (url, data) => {
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        data: data
      }),
      headers: {"Content-Type": "application/json"}
    }).then(res => {
      console.log(res);
    });
  };

  apiGet = (url, callback) => {       
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data));
  };

  render() {
    return (
      <div className="app-containter">
        <Menu callback={this.onMenuItemSelected} />
        { this.state.selectedMenu == "lights" ? <Lights post={this.apiPost} /> : null }
        { this.state.selectedMenu == "leds" ? <Leds post={this.apiPost} /> : null }
        { this.state.selectedMenu == "profiles" ? <Profiles post={this.apiPost} get={this.apiGet} /> : null }
      </div>
    );
  }
}