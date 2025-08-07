import { LedControl } from "../Automation/LedControl";
import * as Music from '../../Data/music.json';
import './DnDContainer.css';
import { useEffect, useState } from "react";
import ADDRESS, { Get } from "../../Logik/Network";

export const DnDContainer = () => {
    const [selectedPlaylist, setSelectedPlaylist] = useState("");


    const selectPl = (id) => {
        Get(ADDRESS + "/spotify/playlist/set?id=" + id, () => { //Get Playlist tracks

        });
        setSelectedPlaylist(id);
    };


    return (
        <div className="dnd-container">
            <div className="led-container">
                <LedControl name='Bar' address={"http://192.168.178.65"} />
                <LedControl name='Wand' address={"http://192.168.178.66"} />
            </div>
            <div>
                {Object.keys(Music).map((group, index) => {
                    return group !== "default" ? (
                        <div className="pl-group">
                            <div className="pl-group-header">{group}</div>
                            <div className="sub-group-container">
                                {Object.keys(Music[group]).map((subGroup, sIndex) => {
                                    return (
                                        <div className="pl-sub-group" onClick={() => selectPl(Music[group][subGroup]["link"])}>
                                            <img style={{ 
                                                width: Music[group][subGroup]["link"] !== selectedPlaylist ? 200 : "", 
                                                height: Music[group][subGroup]["link"] !== selectedPlaylist ? 200 : "", 
                                                padding: Music[group][subGroup]["link"] !== selectedPlaylist ? 16 : ""
                                            }} src={Music[group][subGroup]["img"]} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : null
                })}
            </div>
        </div>
    );
};