import React, { createRef } from "react";
import "./Content.css";
import DetailView from "./DetailView";
import MainView from "./MainView";

export default class Content extends React.Component {
    constructor(props) {
        super(props);
        this.mainViewRef = createRef();
        this.detailViewRef = createRef();
    }

    detailViewShow = (field) => {
        this.mainViewRef.current.hideMainView();
        this.detailViewRef.current.showDetailView(field);
    }

    detailViewHide = () => {
        this.mainViewRef.current.showMainView();
        this.detailViewRef.current.hideDetailView();
    }

    render() {    
        return (
            <div className="content-container">
                <MainView ref={this.mainViewRef} showDetailView={this.detailViewShow} />
                <DetailView ref={this.detailViewRef} get={this.props.get} post={this.props.post} hideDetailView={this.detailViewHide} />
            </div>
        );
    }
}