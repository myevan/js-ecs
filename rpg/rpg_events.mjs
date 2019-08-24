import { E_KeyPressed } from '../core/events.mjs'
import { NK_Unknown, NK_Up, NK_Down, NK_Left, NK_Right } from '../core/numbers.mjs';

export class E_Factory {
    constructor() {
        this.chKeyNums = {
            'k': NK_Up,
            'j': NK_Down,
            'h': NK_Left,
            'l': NK_Right,
        };
    }
    createKeyPressedFromCharacter(ch, info) {
        let keyNum = this.chKeyNums[ch];
        if (keyNum) {
            return new E_KeyPressed(keyNum, info);
        } else {
            return new E_KeyPressed(NK_Unknown, info);
        }
    }
}
