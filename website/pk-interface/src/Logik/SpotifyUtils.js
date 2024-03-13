import axios from "axios";

const GetSearch = async (token, params) => {
    return await axios.get("https://api.spotify.com/v1/search", {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: params
    });
};
const GetPlaylist = async (token, id) => {
    return await axios.get("https://api.spotify.com/v1/playlists/" + id, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};
const GetPlaylistTracks = async (token, id, url) => {
    let u = url !== undefined ? url : ("https://api.spotify.com/v1/playlists/" + id + "/tracks");
    return await axios.get(u, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};
const GetTrack = async (token, id) => {
    return await axios.get("https://api.spotify.com/v1/tracks/" + id, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

const ShuffleArray = (array) => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }  
    return array;
}
    
export {GetSearch, GetPlaylist, GetPlaylistTracks, GetTrack, ShuffleArray};