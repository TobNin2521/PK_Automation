import React from "react";
import "./DetailView.css";
import Element from "./Element";
import Config from "../config/Layout";

export default class DetailView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            toggled: false,
            field: ""
        }
    }

    hideDetailView = () => {
        this.setState({
            toggled: false
        });
    }

    showDetailView = (field) => {
        this.setState({
            toggled: true,
            field: field
        });
    }

    render() {  
        let detailViewClasses =  this.state.toggled ? "detail-view-container detail-view-shown" : "detail-view-container detail-view-hidden"; 
        let elements = [];
        if(Config[this.state.field] && Config[this.state.field].items) {
            for(let i = 0; i < Config[this.state.field].items.length; i++) {
                let item = Config[this.state.field].items[i];
                elements.push(<Element item={item} key={item.apiKey} get={this.props.get} post={this.props.post} />);
            }
        }
        let styles = {
            view: {
                backgroundImage: this.state.field != "" ? "url('../images/" + this.state.field + ".png')" : ""
            }
        };
        return (
            <div className={detailViewClasses} style={styles.view} /*onClick={this.props.hideDetailView}*/>
                <div className="detail-view-back" onClick={this.props.hideDetailView}>

                </div>
                { elements }
            </div>
        );
    }
}