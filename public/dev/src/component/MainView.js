import React from "react";
import "./MainView.css";
import Config from "../config/Layout";
import ViewField from "./ViewField";

export default class MainView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            toggled: true
        };
    }

    hideMainView = () => {
        this.setState({
            toggled: false
        });
    }

    showMainView = () => {
        this.setState({
            toggled: true
        });
    }

    render() {  
        let mainViewClasses =  this.state.toggled ? "main-view-container main-view-shown" : "main-view-container main-view-hidden"; 
        let viewFields = [];
        for(let field in Config) {
            let styles = {
                width: Config[field].bbox.w + "%", 
                height: Config[field].bbox.h + "%", 
                left: Config[field].bbox.x + "%", 
                top: Config[field].bbox.y + "%"
            };
            viewFields.push(<ViewField style={styles} key={field} name={Config[field].name} field={field} click={this.props.showDetailView} />);
        }
        return (
            <div className={mainViewClasses}>
                {viewFields}
            </div>
        );
    }
}