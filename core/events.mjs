import { EventData } from '../base/ecs.mjs';
import { NE_KeyEvent } from './numbers.mjs'

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
