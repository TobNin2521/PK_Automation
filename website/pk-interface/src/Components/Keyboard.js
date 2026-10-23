import { useEffect, useRef, useState } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

export const KeybordComp = ({showKeyboard, value, setKeyboardValue, onKeyboardPress}) => {
    const [show, setShow] = useState(false);
    const [layoutName, setLayoutName] = useState('default');
    const keyboard = useRef(null);

    useEffect(() => {
        const closeKeyboard = () => setShow(false);
        window.addEventListener("closeAllKeyboards", closeKeyboard, false);
        return () => window.removeEventListener("closeAllKeyboards", closeKeyboard, false);
    }, []);

    useEffect(() => {
        if(showKeyboard === true) {
            const event = new Event("closeAllKeyboards");
            window.dispatchEvent(event);
        }
        const timer = setTimeout(() => {
            setShow(showKeyboard);
        }, 500);
        return () => clearTimeout(timer);
    }, [showKeyboard]);

    // Keep the keyboard's internal buffer in sync when the value is changed from outside (typing, clearing)
    useEffect(() => {
        if(value !== undefined && keyboard.current) {
            keyboard.current.setInput(value);
        }
    }, [value]);

    const keyPress = (button) => {
        if(button === '{shift}' || button === '{lock}') {
            setLayoutName((prev) => prev === 'default' ? 'shift' : 'default');
        }
        if(onKeyboardPress) onKeyboardPress(button);
    };

    return (
        <div className={show === true ? 'keyboard-container keyboard-shown' : 'keyboard-container'}>
          <Keyboard keyboardRef={(r) => (keyboard.current = r)} layoutName={layoutName} layout={{
                'default': [
                '^ 1 2 3 4 5 6 7 8 9 0 ß \´ {bksp}',
                '{tab} q w e r t z u i o p ü +',
                '{lock} a s d f g h j k l ö ä # {enter}',
                '{shift} y x c v b n m , . - {shift}',
                '@ {space} {⌨}'
                ],
                'shift': [
                '° ! " § $ % & / ( ) = ? ` {bksp}',
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
            }} onChange={(e) => setKeyboardValue(e)} onKeyPress={keyPress} />
        </div>
    );
};
