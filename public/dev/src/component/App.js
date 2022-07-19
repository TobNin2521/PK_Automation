import React, { createRef, Profiler } from "react";
import Menu from "./Menu";
import "./App.css";
import Content from "./Content";
import Settings from "./Settings";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedMenu: "lights"
    };
    this.contentRef = createRef();
    this.settingsRef = createRef();
  }

  onMenuItemSelected = (menuName) => {
    //this.contentRef.current.detailViewShow();
    this.settingsRef.current.showSettings();
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
        <Settings ref={this.settingsRef} />
        <Menu callback={this.onMenuItemSelected} />
        <Content get={this.apiGet} post={this.apiPost} ref={this.contentRef} />
      </div>
    );
  }
}