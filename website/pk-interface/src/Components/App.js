import { Post } from '../Logik/Network';
import './App.css';
import { Automation } from './Automation/Automation';
import { Spotify } from './Spotify/Spotify';

export const App = () => {

  return (
    <div className="App">
      <div className='left-panel'>
        <Automation />
      </div>
      <div className='right-panel'>
        <Spotify />
      </div>
    </div>
  );
}
