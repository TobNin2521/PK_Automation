import './PlaylistItem.css';

export const PlaylistItem = ({playlist, onClick}) => {

    return (
        playlist !== null ? (
            <div className="playlist" onClick={() => onClick(playlist.id)}>
                {playlist.image ? <img src={playlist.image} /> : null}
                <div className='playlist-info'>
                    {playlist.name}
                </div>
                <div className='playlist-tracks'>
                    Tracks: {playlist.total}
                </div>
            </div>
        ) : null
    );
};
