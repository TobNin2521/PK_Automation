import React from "react";
import "./ViewField.css";

export default class ViewField extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {  
        const styles = {
            viewField: this.props.style
        };
        return (
            <div className="view-field-container" style={styles.viewField} onClick={() => this.props.click(this.props.field)}>
                { this.props.name }
            </div>
        );
    }
}