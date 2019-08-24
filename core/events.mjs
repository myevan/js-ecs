import { EventData } from '../base/ecs.mjs';

export const NE_KeyEvent = 1;

export const NK_Unknown = 0;
export const NK_Up = 1;
export const NK_Down = 2;
export const NK_Left = 4;
export const NK_Right = 8;

export class E_KeyEvent extends EventData {
    constructor(knum, info) {
        super();
        this.knum = knum
        this.info = info
    }
    getEventNum() {
        return NE_KeyEvent;
    }
    getKeyNum() {
        return this.knum;
    }
}

export class E_KeyPressed extends E_KeyEvent {
}
