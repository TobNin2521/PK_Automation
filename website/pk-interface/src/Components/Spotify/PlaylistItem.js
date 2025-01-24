import './PlaylistItem.css';

export const PlaylistItem = ({playlist, onClick}) => {

    return (
        playlist !== null ? (
            <div className="playlist" onClick={() => onClick(playlist.id)}>
                {playlist.images !== undefined && playlist.images !== null && playlist.images.length > 0 ? <img src={playlist.images[0].url} /> : null}
                <div className='playlist-info'>
                    {playlist.name}                
                </div>
                <div className='playlist-tracks'>
                    Tracks: {playlist.tracks.total}
                </div>
            </div>
        ) : null
    );
};