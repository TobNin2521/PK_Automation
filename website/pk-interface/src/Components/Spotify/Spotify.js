import { useEffect, useRef, useState } from 'react';
import './Spotify.css';
import { PlaylistDialog } from './PlaylistDialog';
import { Content } from './Content';
import { Get } from '../../Logik/Network';

export const Spotify = () => {  
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  
  useEffect(() => {
    setTimeout(() => {
      getTokens();
      checkForPlaylist();
    }, 2000);
  }, []);

  const getTokens = () => {
    let res = JSON.parse(document.getElementById('token-frame').contentWindow.document.getElementsByTagName("body")[0].innerText);
    setToken(res.token);
    setRefreshToken(res.refresh_token);
    startExpirationTimer();
  };

  const refresh = () => {
    Get(window.location.origin + "/refresh", (res) => {
      setToken(res.token);
      setRefreshToken(res.refresh_token);
    });
  };

  const startExpirationTimer = () => {
    setInterval(() => {
      refresh();
    }, (60 * 60 * 1000) - 10000);
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
      <PlaylistDialog visible={showPlaylistDialog} token={token} playlistId={playlistId} onHide={() => setShowPlaylistDialog(false)} setPlaylistId={(id) => {setPlaylistId(id); localStorage.setItem("pk-playlist", id)}}/>
      <Content token={token} playlistId={playlistId} showSettings={() => setShowPlaylistDialog(true)} />
      <iframe id='token-frame' src={window.location.origin + '/login'} style={{display: 'none'}}></iframe>
    </div>
  );
};
