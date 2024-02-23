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
        <button onClick={() => switchOff(1)}>Off</button><b>1</b><button onClick={() => switchOn(1)}>On</button>
        <button onClick={() => switchOff(2)}>Off</button><b>2</b><button onClick={() => switchOn(2)}>On</button>
        <button onClick={() => switchOff(3)}>Off</button><b>3</b><button onClick={() => switchOn(3)}>On</button>
        <button onClick={() => switchOff(4)}>Off</button><b>4</b><button onClick={() => switchOn(4)}>On</button>
        <button onClick={() => switchOff(5)}>Off</button><b>5</b><button onClick={() => switchOn(5)}>On</button>
        <button onClick={() => switchOff(6)}>Off</button><b>6</b><button onClick={() => switchOn(6)}>On</button>
      </div>
    </div>
  );
}
