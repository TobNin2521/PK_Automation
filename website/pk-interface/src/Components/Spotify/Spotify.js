import { useEffect, useRef, useState } from 'react';
import './Spotify.css';
import { PlaylistDialog } from './PlaylistDialog';
import { Content } from './Content';
import ADDRESS, { Get } from '../../Logik/Network';

export const Spotify = () => {  
  const [playlistId, setPlaylistId] = useState("");
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [spotifyInitialized, setSpotifyInitialized] = useState(false);
  
  useEffect(() => {
    setTimeout(() => {
      getTokens();
      checkForPlaylist();
    }, 2000);    
  }, []);

  const getTokens = () => {
    let res = JSON.parse(document.getElementById('token-frame').contentWindow.document.getElementsByTagName("body")[0].innerText);
    window.token = res.token;
    setSpotifyInitialized(true);
  };


  const checkForPlaylist = () => {
    let pl = localStorage.getItem("pk-playlist");
    if(pl === undefined || pl === null || pl === "") {
      setShowPlaylistDialog(true);
    }
    else setPlaylistId(pl);
  };

  return (
    <div className="Spotify">
      {spotifyInitialized === true ? (<>
        <PlaylistDialog visible={showPlaylistDialog} playlistId={playlistId} onHide={() => setShowPlaylistDialog(false)} setPlaylistId={(id) => {setPlaylistId(id); localStorage.setItem("pk-playlist", id)}}/>
        <Content playlistId={playlistId} showSettings={() => setShowPlaylistDialog(true)}/>
      </>) : null}
      <iframe id='token-frame' src={ADDRESS + '/login'} style={{display: 'none'}}></iframe>
    </div>
  );
};
