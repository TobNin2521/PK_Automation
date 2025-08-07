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
import ADDRESS, { Get } from '../../Logik/Network';

export const Content = ({playlistId, showSettings}) => {
  const [plTracks, setPlTracks] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState("");

  useEffect(() => {        
      if(playlistId !== null && playlistId !== "") {
          setPlaylist();           
      }
  }, [playlistId]);

  const setPlaylist = () => {
    Get(ADDRESS + "/spotify/playlist/set?id=" + playlistId, () => { //Get Playlist tracks
      getPlaylistTracks((tracks) => {
      })
    });
  };

  const getPlaylistTracks = (cb) => {
    Get(ADDRESS + "/spotify/playlist/tracks", (tracks) => { //Get Playlist tracks
      setPlTracks(tracks);
      cb(tracks);
    });
  };

  const getNextTrack = (cb) => {
    Get(ADDRESS + "/spotify/tracks/next", (track) => { //Get Next track
      cb(track);
    });
  };

  const addUserTrack = (id) => {
      GetTrack(window.token, id).then(res => {
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
    getNextTrack((track) => {
      getPlaylistTracks((tracks) => {
        setPlTracks(tracks);
        setCurrentTrackId(track.track.id);
      });
    });
  };  

  return (
      <div className="content">
          <TopBar addTrack={addUserTrack} showSettings={showSettings} />
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
          <Player actTrack={currentTrackId} trackFinished={trackFinished} onStart={trackFinished} />
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