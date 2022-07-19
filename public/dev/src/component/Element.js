import React from "react";
import "./Element.css";
import ElementDetail from "./ElementDetail";

export default class Element extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showDetails: false
        }
    }

    onElementClick = (e) => {
        this.setState({
            showDetails: !this.state.showDetails
        });
    }

    closeElementDetails = () => {
        this.setState({
            showDetails: false
        });
    }

    render() {  
        const styles = {
            element: {                
                width: this.props.item.bbox.w + "%", 
                height: this.props.item.bbox.h + "%", 
                left: this.props.item.bbox.x + "%", 
                top: this.props.item.bbox.y + "%"
            }
        };
        let elementDetailClasses =  this.state.showDetails ? "element-details-container element-detail-shown" : "element-details-container element-detail-hidden"; 
        return (
            <div>
                <div className="element-container" style={styles.element} onClick={this.onElementClick}>
                    { this.props.item.name }
                </div>
                <div className={elementDetailClasses}>
                    <ElementDetail item={this.props.item} closeDetails={this.closeElementDetails} get={this.props.get} post={this.props.post}/>
                </div>
                { this.state.showDetails ? <div className="element-overlay" onClick={this.onElementClick}></div> : null }
            </div>
        );
    }
}