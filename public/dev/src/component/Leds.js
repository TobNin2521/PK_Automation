import React from "react";

export default class Leds extends React.Component {
    constructor(props) {
        super(props);
        fetch("", {
            method: "POST",
            body: {id: "walls", animation: "dance"}
        }).then(data => {

        });
    }

    render() {
        return (
            <div className="leds-containter">
            //Brightness slider 0-255 <br/>
            //Animation and color selection for strips
            </div>
        );
    }
}