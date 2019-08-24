import { EventData } from '../base/ecs.mjs';
import { NE_Key } from './numbers.mjs'

export class E_Key extends EventData {
    constructor(num, info) {
        super();
        this.num = num
        this.info = info
    }
    getEventNum() {
        return NE_Key;
    }
    getKeyNum() {
        return this.num;
    }
}

export class E_KeyPressed extends E_Key {
}
