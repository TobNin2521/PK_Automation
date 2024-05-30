import { useEffect, useState } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

export const KeybordComp = ({showKeyboard, setKeyboardValue, onKeyboardPress}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(showKeyboard);
    }, [showKeyboard]);

    return (
        <div className={show === true ? 'keyboard-container keyboard-shown' : 'keyboard-container'}>         
          <Keyboard layout={{          
                'default': [
                '^ 1 2 3 4 5 6 7 8 9 0 ß \´ {bksp}',
                '{tab} q w e r t z u i o p ü +',
                '{lock} a s d f g h j k l ö ä # {enter}',
                '{shift} y x c v b n m , . - {shift}',
                '@ {space} {⌨}'
                ],
                'shift': [
                '° ! " § $ % &amp; / ( ) = ? ` {bksp}',
                '{tab} Q W E R T Z U I O P Ü *',
                '{lock} A S D F G H J K L Ö Ä \' {enter}',
                '{shift} Y X C V B N M ; : _ {shift}',
                '@ {space} {⌨}'
                ]
            }
            } display={{
            '{⌨}': '⌨',
            '{tab}': '⇆',
            '{bksp}': '⟵',
            '{enter}': '⤶',
            '{lock}': '⇩',
            '{shift}': '⇧',
            '{space}': ' '
            }} onChange={(e) => setKeyboardValue(e)} onKeyPress={onKeyboardPress} />
        </div>
    );
};