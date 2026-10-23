import { useCallback, useEffect, useState } from 'react';
import update from 'immutability-helper'
import { TopBar } from './TopBar';
import { Track } from './Track';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import './Content.css';
import { Player } from './Player';
import { AddTrack, MoveTrack } from '../../Logik/Api';

// Shows the queues of the server. Reordering is applied here right away while dragging and
// sent to the server once the track is dropped.
export const Content = ({state, showSettings}) => {
    const [plTracks, setPlTracks] = useState(state.playlistQueue);
    const [userTracks, setUserTracks] = useState(state.userQueue);

    useEffect(() => {
        setPlTracks(state.playlistQueue);
    }, [state.playlistQueue]);

    useEffect(() => {
        setUserTracks(state.userQueue);
    }, [state.userQueue]);

    const addUserTrack = (id) => {
        AddTrack(id).catch(err => console.log(err));
    };

    const movePlTrack = useCallback((dragIndex, hoverIndex) => {
      setPlTracks((prevTracks) =>
        update(prevTracks, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevTracks[dragIndex]],
          ],
        }),
      )
    }, []);

    const renderPlTrack = useCallback((track, index) => {
      return (
        <Track
          key={index}
          track={track}
          type={"playlist"}
          index={index}
          moveTrack={movePlTrack}
          onDrop={(from, to) => MoveTrack("playlist", from, to).catch(err => console.log(err))}
        />
      )
    }, []);

    const moveUserTrack = useCallback((dragIndex, hoverIndex) => {
      setUserTracks((prevTracks) =>
        update(prevTracks, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevTracks[dragIndex]],
          ],
        }),
      )
    }, []);

    const renderUserTrack = useCallback((track, index) => {
      return (
        <Track
          key={index}
          track={track}
          type={"user"}
          index={index}
          moveTrack={moveUserTrack}
          onDrop={(from, to) => MoveTrack("user", from, to).catch(err => console.log(err))}
        />
      )
    }, []);

    return (
        <div className="content">
            <TopBar addTrack={addUserTrack} showSettings={showSettings} />
            <div className='queue-container'>
                <DndProvider backend={HTML5Backend}>
                    <div className={userTracks.length > 0 ? 'user-queue' : 'user-queue queue-hidden'}>
                        {userTracks.map((item, index) => {
                            return renderUserTrack(item, index);
                        })}
                    </div>
                </DndProvider>
                <DndProvider backend={HTML5Backend}>
                    <div className='playlist-queue'>
                        {plTracks.map((item, index) => {
                            return renderPlTrack(item, index);
                        })}
                    </div>
                </DndProvider>
            </div>
            <Player />
        </div>
    );
};
