import { useEffect, useState } from "react";
import { GetSearch } from "../../Logik/SpotifyUtils";
import './TopBar.css';

export const TopBar = ({token, addTrack, showSettings}) => {
    const [searchVal, setSearchVal] = useState("");
    const [searchTracks, setSearchTracks] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    useEffect(() => {
        if(searchVal !== "") {
            GetSearch(token, {
                q: searchVal,
                type: "track"
            }).then(res => setSearchTracks(res.data.tracks.items));
        }
    }, [searchVal]);

    return (
        <>
            <div className="top-bar">
                <input className="track-search" type="text" placeholder="Search" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onBlur={() => setShowSearchResults(false)} onFocus={() => setShowSearchResults(true)}/>
                <div className="settings-button" onClick={showSettings}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path className="fa-primary" d="M489.6 191.2c6.9-6.2 9.6-15.9 6.4-24.6c-4.4-11.9-9.7-23.3-15.8-34.3l-4.7-8.1c-6.6-11-14-21.4-22.1-31.2c-5.9-7.2-15.7-9.6-24.5-6.8L389.1 98.8c-10 3.2-20.8 1.1-29.7-4.6c-4.9-3.1-9.9-6.1-15.1-8.7c-9.3-4.8-16.5-13.2-18.8-23.4l-8.9-40.7c-2-9.1-9-16.3-18.2-17.8C284.7 1.2 270.5 0 256 0s-28.7 1.2-42.5 3.5c-9.2 1.5-16.2 8.7-18.2 17.8l-8.9 40.7c-2.2 10.2-9.5 18.6-18.8 23.4c-5.2 2.7-10.2 5.6-15.1 8.7c-8.8 5.7-19.7 7.7-29.7 4.6L83.1 86.1c-8.8-2.8-18.6-.3-24.5 6.8c-8.1 9.8-15.5 20.2-22.1 31.2l-4.7 8.1c-6.1 11-11.4 22.4-15.8 34.3c-3.2 8.7-.5 18.4 6.4 24.6l30.9 28.1c7.7 7.1 11.4 17.5 10.9 27.9c-.1 2.9-.2 5.8-.2 8.8s.1 5.9 .2 8.8c.5 10.5-3.1 20.9-10.9 27.9L22.4 320.8c-6.9 6.2-9.6 15.9-6.4 24.6c4.4 11.9 9.7 23.3 15.8 34.3l4.7 8.1c6.6 11 14 21.4 22.1 31.2c5.9 7.2 15.7 9.6 24.5 6.8l39.7-12.6c10-3.2 20.8-1.1 29.7 4.6c4.9 3.1 9.9 6.1 15.1 8.7c9.3 4.8 16.5 13.2 18.8 23.4l8.9 40.7c2 9.1 9 16.3 18.2 17.8c13.8 2.3 28 3.5 42.5 3.5s28.7-1.2 42.5-3.5c9.2-1.5 16.2-8.7 18.2-17.8l8.9-40.7c2.2-10.2 9.4-18.6 18.8-23.4c5.2-2.7 10.2-5.6 15.1-8.7c8.8-5.7 19.7-7.7 29.7-4.6l39.7 12.6c8.8 2.8 18.6 .3 24.5-6.8c8.1-9.8 15.5-20.2 22.1-31.2l4.7-8.1c6.1-11 11.3-22.4 15.8-34.3c3.2-8.7 .5-18.4-6.4-24.6l-30.9-28.1c-7.7-7.1-11.4-17.5-10.9-27.9c.1-2.9 .2-5.8 .2-8.8s-.1-5.9-.2-8.8c-.5-10.5 3.1-20.9 10.9-27.9l30.9-28.1zM256 160a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/>
                        <path className="fa-secondary" d="M192 256a64 64 0 1 1 128 0 64 64 0 1 1 -128 0z"/>
                    </svg>
                </div>
            </div>
            <div className={showSearchResults === true && searchVal !== "" ? "track-search-results" : "track-search-results results-hidden"}>
                {searchTracks.map((item, index) => {
                    return (
                        <div key={index} className="track-search-result" onClick={()=>addTrack(item.id)}>
                            <img src={item.album.images[0].url} />
                            <div className="track-info">
                                <div className="track-name">{item.name}</div>
                                <div className="track-artist">{item.artists[0].name}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};