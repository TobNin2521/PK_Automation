import { useEffect, useRef, useState } from "react";
import './Player.css';
import { GetToken, NextTrack } from "../../Logik/Api";
import { Subscribe } from "../../Logik/Server";

// Plays what the server hands out: asks for the next track when started, when a track is over
// and when the server sends a skip signal. The queue itself lives on the server.
export const Player = () => {
    const [showPlayer, setShowPlayer] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(localStorage.getItem("pk-volume") !== null ? Number(localStorage.getItem("pk-volume")) : 0.1);
    const [trackProgress, setTrackProgress] = useState(0);
    const [currentTrack, setCurrentTrack] = useState(null);

    const player = useRef(null);
    const initialized = useRef(false);
    const deviceId = useRef(null);
    // The timer and the server callbacks outlive the render they were created in, so they read refs
    const playingRef = useRef(false);
    const startedRef = useRef(false);
    const pendingSkip = useRef(false);
    const armed = useRef(false);
    const timer = useRef(null);
    const requesting = useRef(false);

    useEffect(() => {
        if(initialized.current === true) return;
        initialized.current = true;
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
        window.onSpotifyWebPlaybackSDKReady = () => {
            player.current = new window.Spotify.Player({
                name: 'PK Spotify Player',
                getOAuthToken: getAuthTokenCallback,
                volume: volume
            });
            player.current.addListener('ready', playerReady);
            player.current.addListener('initialization_error', ({ message }) => console.error("INIT ERR:", message));
            player.current.addListener('authentication_error', ({ message }) => console.error("AUTH ERR:", message));
            player.current.addListener('account_error', ({ message }) => console.error("ACCOUNT ERR:", message));
            player.current.addListener('autoplay_failed', () => {
                console.log('Autoplay is not allowed by the browser autoplay rules');
            });
            player.current.connect();
        }
        return () => {
            clearInterval(timer.current);
            timer.current = null;
        };
    }, []);

    // The server sends this when the queue changed in a way that should be heard right away
    useEffect(() => {
        return Subscribe("skip", () => {
            if(playingRef.current === true) playNext();
            // Paused: skip as soon as the music is started again
            else if(startedRef.current === true) pendingSkip.current = true;
        });
    }, []);

    const getAuthTokenCallback = (callback) => {
        GetToken().then((token) => {
            if(!token) {
                console.log("Token refresh failed");
                return;
            }
            callback(token);
        }).catch((err) => console.log(err));
    };

    const playerReady = ({device_id}) => {
        console.log("Player ready!");
        deviceId.current = device_id;
        setShowPlayer(true);
    };

    // Takes the next track from the server and plays it
    const playNext = () => {
        if(requesting.current === true) return;
        requesting.current = true;
        NextTrack().then((track) => {
            if(track === null) {
                // Nothing in the queue and no playlist loaded yet
                stopPlayback();
                return;
            }
            return playTrack(track);
        }).catch(err => console.log(err)).finally(() => {
            requesting.current = false;
        });
    };

    const playTrack = async (track) => {
        setCurrentTrack(track);
        setTrackProgress(0);
        // The progress of the previous track must not end this one, see startTimer
        armed.current = false;
        // The token of the page is old after an hour, the server hands out a fresh one
        const token = await GetToken();
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId.current}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: ['spotify:track:' + track.id] }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if(!response.ok) {
            console.log("Play request failed", response.status);
            return;
        }
        startTimer();
    };

    const startTimer = () => {
        if(timer.current !== null) return;
        timer.current = setInterval(() => {
            if(player.current === null) return;
            player.current.getCurrentState().then(state => {
                if(!state) return;
                const progress = state.duration > 0 ? state.position / state.duration : 0;
                setTrackProgress(progress);
                // Only a track that was seen near its start can end, the state still shows the
                // old track for a moment after the next one was requested
                if(progress < 0.9) armed.current = true;
                if(state.paused === true && playingRef.current === true) {
                    player.current.resume();
                }
                if(progress > 0.995 && armed.current === true) {
                    armed.current = false;
                    playNext();
                }
            });
        }, 100);
    };

    const stopPlayback = () => {
        playingRef.current = false;
        setPlaying(false);
        if(player.current !== null) player.current.pause();
    };

    const play = () => {
        playingRef.current = true;
        setPlaying(true);
        if(startedRef.current === false || pendingSkip.current === true) {
            startedRef.current = true;
            pendingSkip.current = false;
            // This click is the user gesture the browser needs to allow audio
            if(player.current.activateElement) player.current.activateElement();
            playNext();
        }
        else {
            player.current.resume();
        }
    };

    const pause = () => {
        playingRef.current = false;
        setPlaying(false);
        player.current.pause();
    };

    const onSetVolume = (vol) => {
        if(!isNaN(vol)) {
            localStorage.setItem("pk-volume", vol);
            setVolume(vol);
            player.current.setVolume(vol);
        }
    };

    return (
        <div className="player-container">
            {showPlayer === true ? (
                <div className="player">
                    {currentTrack !== null ? (
                        <div className="current-track">
                            {currentTrack.image ? <img src={currentTrack.image} /> : null}
                            <div className="current-info">
                                <div className="current-name">{currentTrack.name}</div>
                                <div className="current-artist">{currentTrack.artist}</div>
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
                        <input type="range" value={volume} max={1} min={0} step={0.005} style={{"--fill": (volume * 100) + "%"}} onChange={(e) => onSetVolume(Number(e.target.value))} />
                    </div>
                </div>
            ) : null}
        </div>
    );
};
