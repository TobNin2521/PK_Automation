import axios from "axios";
import ADDRESS from "./Network";

// Client for the music api of the server (server/api.js), all the queue handling happens there
const SearchTracks = async (query) => {
    const res = await axios.get(ADDRESS + "/api/search/tracks", { params: { q: query } });
    return res.data.tracks;
};
const SearchPlaylists = async (query) => {
    const res = await axios.get(ADDRESS + "/api/search/playlists", { params: { q: query } });
    return res.data.playlists;
};
const AddTrack = async (trackId) => {
    await axios.post(ADDRESS + "/api/queue", { trackId: trackId });
};
const MoveTrack = async (list, from, to) => {
    await axios.post(ADDRESS + "/api/queue/move", { list: list, from: from, to: to });
};
const SetPlaylist = async (playlistId) => {
    await axios.post(ADDRESS + "/api/playlist", { playlistId: playlistId });
};
// The track to play next (null when there is nothing to play)
const NextTrack = async () => {
    const res = await axios.post(ADDRESS + "/api/player/next");
    return res.data.track;
};
// Access token for the Spotify web player
const GetToken = async () => {
    const res = await axios.get(ADDRESS + "/refresh");
    return res.data.access_token;
};

// LED devices (server/leds.js): the state is {on, brightness, color: [r, g, b], effect, effects}
const GetLed = async (id) => {
    const res = await axios.get(ADDRESS + "/api/leds/" + id);
    return res.data;
};
// Changes any of on, brightness, color, effect and answers the new state
const SetLed = async (id, change) => {
    const res = await axios.post(ADDRESS + "/api/leds/" + id, change);
    return res.data;
};

export {GetLed, SetLed, SearchTracks, SearchPlaylists, AddTrack, MoveTrack, SetPlaylist, NextTrack, GetToken};
