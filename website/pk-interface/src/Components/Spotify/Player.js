import { useEffect, useRef, useState } from "react";
import './Player.css';

export const Player = ({token, actTrack, trackFinished, onStart}) => {
    const [showPlayer, setShowPlayer] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [started, setStarted] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.1);
    const [playerTimerId, setPlayerTimerId] = useState(-1);
    const [trackProgress, setTrackProgress] = useState(0);
    const [currentTrack, setCurrentTrack] = useState(null);

    const player = useRef(null);

    useEffect(() => {
        if(token !== undefined && token !== null && token !== "") {
            const script = document.createElement("script");
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;        
            document.body.appendChild(script);
            window.onSpotifyWebPlaybackSDKReady = () => {
                player.current = new window.Spotify.Player({
                    name: 'PK Spotify Player',
                    getOAuthToken: cb => { cb(token); },
                    volume: volume
                });
                player.current.addListener('ready', playerReady); 
                player.current.addListener('initialization_error', ({ message }) => console.error(message));              
                player.current.addListener('authentication_error', ({ message }) => console.error(message));              
                player.current.addListener('account_error', ({ message }) => console.error(message));       
                player.current.connect();
            }   
        }
    }, [token]);

    useEffect(() => {     
        if(actTrack !== undefined && actTrack !== null && actTrack !== "" &&
            token !== undefined && token !== null && token !== "" && playing === true) {
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: ['spotify:track:' + actTrack] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }).then((data) => {
                if(playerTimerId < 0) {
                    setPlayerTimerId(
                        setInterval(() => {
                            player.current.getCurrentState().then(state => {
                                if(state !== null) {
                                    setTrackProgress(state.position / state.duration);
                                    if(currentTrack === null) setCurrentTrack(state.track_window.current_track);
                                }
                            });
                        }, 100)
                    );
                }
            }).catch(err => {
                console.log(err);
            });
        }
    }, [actTrack, token, started]);

    useEffect(() => {
        if(trackProgress > 0.995) {
            setCurrentTrack(null);
            clearInterval(playerTimerId);
            setPlayerTimerId(-1);
            trackFinished();
        }
    }, [trackProgress]);

    const playerReady = ({device_id}) => {
        setDeviceId(device_id);
        setShowPlayer(true);
    };

    const play = () => {
        setPlaying(true);
        if(started === false) onStart(); 
        setStarted(true);
        player.current.resume();
    };

    const pause = () => {
        setPlaying(false); 
        player.current.pause();
    };

    return (
        <div className="player-container">
            {showPlayer === true ? (
                <div className="player">
                    {currentTrack !== null ? (
                        <div className="current-track">
                            <img src={currentTrack.album.images[0].url} />
                            <div className="current-info">
                                <div className="current-name">{currentTrack.name}</div>
                                <div className="current-artist">{currentTrack.artists[0].name}</div>
                            </div>
                        </div>
                    ) : null}
                    <div className="player-controls">
                        <div className="play-button">
                            {playing === false ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" onClick={play}>
                                    <path className="fa-primary" d="M212.5 147.5c-7.4-4.5-16.7-4.7-24.3-.5s-12.3 12.3-12.3 20.9V344c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88z"/>
                                    <path className="fa-secondary" d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9V344c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" onClick={pause}>
                                    <path className="fa-primary" d="M192 160c17.7 0 32 14.3 32 32V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32zm128 0c17.7 0 32 14.3 32 32V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32z"/>
                                    <path className="fa-secondary" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM224 192V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32z"/>
                                </svg>
                            )}
                        </div>
                        <div className="player-track">
                            <div style={{width: (100 * trackProgress) + "%" }} className="player-track-fill"></div>
                        </div>
                    </div>
                    <div className="volume-slider">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                            <path className="fa-primary" d="M352 64c0-12.6-7.4-24-18.9-29.2s-25-3.1-34.4 5.3L163.8 160H96c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h67.8L298.7 471.9c9.4 8.4 22.9 10.4 34.4 5.3S352 460.6 352 448V64z"/>
                            <path className="fa-secondary" d="M471.3 110.5c8.4-10.3 23.5-11.8 33.8-3.5c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C507.3 341.3 528 301.1 528 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8zM410.8 185c8.4-10.3 23.5-11.8 33.8-3.5C466.1 199.1 480 225.9 480 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C425.1 284.4 432 271 432 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8z"/>
                        </svg>
                        <input type="range" value={volume} max={1} min={0} step={0.005} onChange={(e) => {setVolume(Number(e.target.value)); player.current.setVolume(Number(e.target.value))}} />
                    </div>
                </div>
            ) : null}
        </div>
    );
};