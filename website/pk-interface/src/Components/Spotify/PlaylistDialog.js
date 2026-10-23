import { useEffect, useState } from 'react';
import './PlaylistDialog.css';
import { SearchPlaylists } from '../../Logik/Api';
import { PlaylistItem } from './PlaylistItem';
import { KeybordComp } from '../Keyboard';

export const PlaylistDialog = ({visible, state, onHide, setPlaylistId}) => {
    const [searchVal, setSearchVal] = useState("");
    const [playlists, setPlaylists] = useState([]);
    const [showKeyboard, setShowKeyboard] = useState(false);

    const currPlaylist = state.playlist;
    const showCurrPlaylist = state.playlistId !== undefined && state.playlistId !== null && state.playlistId !== "";

    useEffect(() => {
        if(searchVal !== "") {
            // Ignore responses of outdated searches that arrive out of order
            let cancelled = false;
            SearchPlaylists(searchVal).then(items => {
                if(!cancelled) setPlaylists(items);
            }).catch(err => console.log(err));
            return () => { cancelled = true; };
        }
    }, [searchVal]);

    const keyboardPress = (key) => {
        if(key === '{⌨}') {
            setShowKeyboard(false);
        }
    };

    return (
        <>
            <div className={"playlist-dialog" + (visible === true ? "" : " hidden") + (showKeyboard === true ? " kbd-open" : "")}>
                <div className="playlist-header">
                    <input className='playlist-search' type='text' placeholder='Search' value={searchVal} onChange={(e) => setSearchVal(e.target.value)}  onFocus={() => setShowKeyboard(true)}/>
                    <div className="settings-close-button" onClick={() => {onHide(); setShowKeyboard(false); setSearchVal(""); setPlaylists([]);}}>
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
                            {currPlaylist !== null ? (<>
                                {currPlaylist.image ? <img src={currPlaylist.image} /> : null}
                                <div className='curr-playlist-info'>
                                    <div className='curr-playlist-name'>{currPlaylist.name}</div>
                                    <div className='curr-playlist-owner'>{currPlaylist.owner}</div>
                                    <div className='curr-playlist-tracks'>Tracks: {currPlaylist.total}</div>
                                </div>
                            </>) : (
                                <div className='curr-playlist-info'>
                                    <div className='curr-playlist-name'>{state.loading === true ? "Loading playlist..." : "Playlist not loaded"}</div>
                                </div>
                            )}
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
            <KeybordComp showKeyboard={showKeyboard} value={searchVal} setKeyboardValue={setSearchVal} onKeyboardPress={keyboardPress} />
        </>
    );
};
