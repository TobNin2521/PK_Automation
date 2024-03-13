import { useCallback, useEffect, useRef, useState } from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';
import { GetPlaylistTracks, GetTrack, ShuffleArray } from '../../Logik/SpotifyUtils';
import update from 'immutability-helper'
import { TopBar } from './TopBar';
import { Track } from './Track';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import './Content.css';
import { Player } from './Player';

export const Content = ({token, playlistId, showSettings}) => {
    const [plTracks, setPlTracks] = useState([]);
    const [userTracks, setUserTracks] = useState([]);
    const [playing, setPlaying] = useState(false);
    const [currentTrackId, setCurrentTrackId] = useState("");

    useEffect(() => {        
        if(playlistId !== null && playlistId !== "") {
            getPlTracks();           
        }
    }, [playlistId]);

    let _tracks = [];
    const getPlTracks = (url) => {
        GetPlaylistTracks(token, playlistId, url).then(res => {
            if(res.data.next !== null) {
                _tracks = [..._tracks, ...res.data.items];
                getPlTracks(res.data.next);
            }
            else {
                _tracks = [..._tracks, ...res.data.items];
                ShuffleArray(_tracks);
                setPlTracks(_tracks);
            }
        });
    };

    const addUserTrack = (id) => {
        GetTrack(token, id).then(res => {
            let track = {track : res.data};
            setUserTracks([...userTracks, track]);
        })
    };

    const movePlTrack = useCallback((dragIndex, hoverIndex) => {
      setPlTracks((prevTracks) =>
        update(prevTracks, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevTracks[dragIndex]],
          ],
        }),
      )
    }, []);

    const renderPlTrack = useCallback((track, index) => {
      return (
        <Track
          key={index}
          track={track}
          type={"playlist"}
          index={index}
          moveTrack={movePlTrack}
        />
      )
    }, []);

    const moveUserTrack = useCallback((dragIndex, hoverIndex) => {
      setUserTracks((prevTracks) =>
        update(prevTracks, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevTracks[dragIndex]],
          ],
        }),
      )
    }, []);

    const renderUserTrack = useCallback((track, index) => {
      return (
        <Track
          key={index}
          track={track}
          type={"user"}
          index={index}
          moveTrack={moveUserTrack}
        />
      )
    }, []);

    const trackFinished = () => {
        if(userTracks.length > 0) {
            let uTracks = [...userTracks];
            let currTrack = uTracks.shift();
            setCurrentTrackId(currTrack.track.id);
            setUserTracks(uTracks);
        }
        else {
            let pTracks = [...plTracks];
            let currTrack = pTracks.shift();
            setCurrentTrackId(currTrack.track.id);
            pTracks.push(currTrack);
            setPlTracks(pTracks);
        }
    };

    return (
        <div className="content">
            <TopBar token={token} addTrack={addUserTrack} showSettings={showSettings} />
            <div className='queue-container'>                
                <DndProvider backend={HTML5Backend}>
                    <div className={userTracks.length > 0 ? 'user-queue' : 'user-queue queue-hidden'}>
                        {userTracks.map((item, index) => {
                            return renderUserTrack(item.track, index);
                        })}
                    </div>
                </DndProvider>
                <DndProvider backend={HTML5Backend}>
                    <div className='playlist-queue'>
                        {plTracks.map((item, index) => {
                            return renderPlTrack(item.track, index);
                        })}
                    </div>
                </DndProvider>
            </div>
            <Player token={token} actTrack={currentTrackId} trackFinished={trackFinished} onStart={trackFinished} />
        </div>
    );
};

/*

            <SpotifyPlayer ref={playerRef} token={token} uris={currTrackUri} hideAttribution={true} play={playing} initialVolume={.5} callback={handleCallback} styles={{                
                bgColor: '#333',
                color: '#469c00',
                sliderColor: '#469c00',
                sliderTrackColor: '#555',
                sliderHandleColor: '#469c00',
                trackArtistColor: '#ddd',
                trackNameColor: '#ccc',
            }}/>
*/