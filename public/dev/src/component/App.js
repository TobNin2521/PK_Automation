import React from "react";
import Leds from "./Leds";
import Lights from "./Lights";
import Menu from "./Menu";

/* API config 

  For LED post:
  {
    id: <string>,                     //String describing the location of the strip (i.e. "bar", "walls", ...)
    animation: <string>,              //Animation name. Currently implemented: rainbow, solid, fade, dance, twinkle
    animationValue: <int>,            //Only for animiations solid and fade: int representation of color value (for solid this describes the one color displayed, for fade this is one of the colors between the strip fades)
    animationValueAlt: <int>          //Only for animiation fade: int representation of color value (second fade color)
  }

  For Lights post:
  {
    id: <string>,                     //String describing the location of the strip (i.e. "bar", "walls", ...)
    state: <bool>                     //Boolean state of the light (true = on, false = off)
  }

*/

export default class App extends React.Component {
  state = {
    selectedMenu: "lights"
  };

  onMenuSelected = (menuName) => {
    this.setState({
      selectedMenu: menuName
    });
  };

  render() {
    return (
      <div className="app-containter">
        <Menu callback={this.onMenuSelected} />
        { this.state.selectedMenu == "lights" ? <Lights /> : null }
        { this.state.selectedMenu == "leds" ? <Leds /> : null }
      </div>
    );
  }
}