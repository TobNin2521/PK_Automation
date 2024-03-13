import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import './Track.css';

export const Track = ({track, type, index, moveTrack}) => {
    const ref = useRef(null);

    const [{ handlerId }, drop] = useDrop({
        accept: type,
        collect(monitor) {
        return {
            handlerId: monitor.getHandlerId(),
        }
        },
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) {
                return;
            }
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            moveTrack(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: type,
        item: () => {
            let id = type + "-" + index;
            return {id, index}
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    
    const opacity = isDragging ? 0.2 : 1;
    drag(drop(ref));

    const style = {
        border: '1px solid #666',
        padding: '0.5rem 1rem',
        backgroundColor: '#444',
        cursor: 'move',
    };
    return (
        <div className={type + "-track track"} ref={ref} style={{ ...style, opacity }} data-handler-id={handlerId}>
            <img src={track.album.images[0].url} />
            <div className='track-info-container'>
                <div className='track-info'>
                    <div className='track-name'>{track.name}</div>
                    <div className='track-artist'>{track.artists[0].name}</div>
                </div>
                <div className='track-album-info'>
                    <div className='track-album'>{track.album.name}</div>
                </div>
                <div className='track-duration-info'>
                    <div className='track-duration'>{Math.floor(track.duration_ms / 60000)}:{Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, "0")}</div>
                </div>
                <div className='track-drag'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path className="fa-primary" d="M448 96c0-17.7-14.3-32-32-32H32C14.3 64 0 78.3 0 96s14.3 32 32 32H416c17.7 0 32-14.3 32-32zm0 320c0-17.7-14.3-32-32-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32z"/>
                        <path className="fa-secondary" d="M0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32z"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};