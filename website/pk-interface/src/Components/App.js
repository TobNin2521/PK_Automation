import { Post } from '../Logik/Network';
import './App.css';

export const App = () => {

  const switchOn = (pin) => {
    Post("http://127.0.0.1:8081/relay", {
      id: pin,
      status: 1
    }, (res) => {
      console.log(res);
    });
  };

  const switchOff = (pin) => {
    Post("http://127.0.0.1:8081/relay", {
      id: pin,
      status: 0
    }, (res) => {
      console.log(res);
    });
  };

  return (
    <div className="App">
      <div>
        <button onClick={() => switchOff(13)}>Off</button><b>13</b><button onClick={() => switchOn(1)}>On</button>
        <button onClick={() => switchOff(19)}>Off</button><b>19</b><button onClick={() => switchOn(2)}>On</button>
        <button onClick={() => switchOff(20)}>Off</button><b>20</b><button onClick={() => switchOn(3)}>On</button>
        <button onClick={() => switchOff(21)}>Off</button><b>21</b><button onClick={() => switchOn(4)}>On</button>
        <button onClick={() => switchOff(26)}>Off</button><b>26</b><button onClick={() => switchOn(5)}>On</button>
        <button onClick={() => switchOff(27)}>Off</button><b>27</b><button onClick={() => switchOn(6)}>On</button>
      </div>
    </div>
  );
}
