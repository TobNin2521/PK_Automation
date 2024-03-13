import './PlaylistItem.css';

export const PlaylistItem = ({playlist, onClick}) => {

    return (
        <div className="playlist" onClick={() => onClick(playlist.id)}>
            {playlist.images !== undefined && playlist.images !== null && playlist.images.length > 0 ? <img src={playlist.images[0].url} /> : null}
            <div className='playlist-info'>
                {playlist.name}
            </div>
        </div>
    );
};