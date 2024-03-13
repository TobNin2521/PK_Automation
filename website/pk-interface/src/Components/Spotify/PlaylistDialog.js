import { useEffect, useState } from 'react';
import './PlaylistDialog.css';
import { GetPlaylist, GetSearch } from '../../Logik/SpotifyUtils';
import { PlaylistItem } from './PlaylistItem';

export const PlaylistDialog = ({visible, token, playlistId, onHide, setPlaylistId}) => {
    const [searchVal, setSearchVal] = useState("");
    const [playlists, setPlaylists] = useState([]);
    const [showCurrPlaylist, setShowCurrPlaylist] = useState(false);
    const [currPlaylist, setCurrPlaylist] = useState(null);

    useEffect(() => {
        if(searchVal !== "") {
            GetSearch(token, {
                q: searchVal,
                type: "playlist"
            }).then(res => setPlaylists(res.data.playlists.items));
        }
    }, [searchVal, token]);

    useEffect(() => {
        if(playlistId !== undefined && playlistId !== null && playlistId !== "") {
            GetPlaylist(token, playlistId).then(res => {
                setCurrPlaylist(res.data);
                setShowCurrPlaylist(playlistId !== undefined && playlistId !== null && playlistId !== "");
            });
        }
    }, [playlistId, token]);

    return (
        <div className={visible === true ? "playlist-dialog" : "playlist-dialog hidden"}>
            <div style={{height: "5em", display: "flex", flexDirection: "row"}}>
                <input className='playlist-search' type='text' placeholder='Search' value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
                <div className="settings-close-button" onClick={onHide}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path className="fa-primary" d="M209 175c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47z"/>
                        <path className="fa-secondary" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
                    </svg>
                </div>
            </div>
            {showCurrPlaylist === true ? (
                <div className='curr-playlist-container'>
                    <div>Currently selected playlist:</div>
                    <div className='curr-playlist'>
                        <img src={currPlaylist.images[0].url} />
                        <div className='curr-playlist-info'>
                            <div className='curr-playlist-name'>{currPlaylist.name}</div>
                            <div className='curr-playlist-owner'>{currPlaylist.owner.display_name}</div>
                            <div className='curr-playlist-tracks'>Tracks: {currPlaylist.tracks.total}</div>
                        </div>
                    </div>
                </div>
            ) : null}
            <div className='dialog-title'>
                Select a default playlist to be queued:
            </div>
            <div className='playlist-container'>
                {playlists.map((item, index) => {
                    return <PlaylistItem key={index} playlist={item} onClick={(id) => {setPlaylistId(id); setSearchVal(""); setPlaylists([]); onHide();}} />
                })}
            </div>
        </div>
    );
};