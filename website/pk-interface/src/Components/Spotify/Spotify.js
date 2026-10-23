import { useEffect, useRef, useState } from 'react';
import './Spotify.css';
import { PlaylistDialog } from './PlaylistDialog';
import { Content } from './Content';
import ADDRESS from '../../Logik/Network';
import { GetToken, SetPlaylist } from '../../Logik/Api';
import { Subscribe } from '../../Logik/Server';

export const Spotify = () => {
  const [serverState, setServerState] = useState(null);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [spotifyInitialized, setSpotifyInitialized] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const dialogChecked = useRef(false);

  useEffect(() => {
    getTokens();
    // The queue and the playlist live on the server, this is its latest state
    return Subscribe("state", setServerState);
  }, []);

  // Ask for a playlist on the first start, when none was selected yet
  useEffect(() => {
    if(serverState !== null && dialogChecked.current === false) {
      dialogChecked.current = true;
      if(serverState.playlistId === "") setShowPlaylistDialog(true);
    }
  }, [serverState]);

  // The Spotify login page can't be shown in a frame, so the login is a normal redirect:
  // /login -> Spotify -> /callback (server keeps the refresh token) -> back to this page.
  // The web player then gets its access token from the server like on any later refresh.
  const getTokens = () => {
    GetToken().then((token) => {
      if(token) {
        sessionStorage.removeItem("pk-login-tried");
        setSpotifyInitialized(true);
      }
      else if(sessionStorage.getItem("pk-login-tried") === null) {
        // Not logged in yet. Only redirect once per session so a failing login can't loop forever
        sessionStorage.setItem("pk-login-tried", "1");
        window.location.href = ADDRESS + "/login";
      }
      else {
        setLoginFailed(true);
      }
    }).catch((err) => console.log(err));
  };

  return (
    <div className="Spotify">
      {spotifyInitialized === true && serverState !== null ? (<>
        <PlaylistDialog visible={showPlaylistDialog} state={serverState} onHide={() => setShowPlaylistDialog(false)} setPlaylistId={(id) => SetPlaylist(id).catch((err) => console.log(err))}/>
        <Content state={serverState} showSettings={() => setShowPlaylistDialog(true)}/>
      </>) : null}
      {loginFailed === true ? (
        <div className="spotify-login-failed" onClick={() => { sessionStorage.removeItem("pk-login-tried"); window.location.href = ADDRESS + "/login"; }}>
          Spotify login failed. Tap to try again.
        </div>
      ) : null}
    </div>
  );
};
