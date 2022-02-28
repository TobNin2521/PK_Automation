import React from "react";
import Leds from "./Leds";
import Lights from "./Lights";
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

  render() {
    return (
      <div className="app-containter">
        <Menu callback={this.onMenuItemSelected} />
        { this.state.selectedMenu == "lights" ? <Lights /> : null }
        { this.state.selectedMenu == "leds" ? <Leds /> : null }
      </div>
    );
  }
}