import { useEffect, useState } from 'react';
import './Spotify.css';
import { PlaylistDialog } from './PlaylistDialog';
import { Content } from './Content';

export const Spotify = () => {
  const CLIENT_ID = "93f99cd3786048ae99ae5cd292283605";
  const REDIRECT_URI = "http://localhost:3000";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";  
  const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-library-modify',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public'
  ];
  
  const [token, setToken] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  useEffect(() => {
    handleToken();
    checkForPlaylist();
  }, []);

  const handleToken = () => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");
    if (!token && hash) {
        console.log(hash);
        token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
        window.location.hash = "";
        window.localStorage.setItem("token", token);
    }
    if(!token && !hash) {
      window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join(
        '%20',
      )}&show_dialog=false`;
    }
    setToken(token);
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
    </div>
  );
};
