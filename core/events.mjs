import { EventData } from '../base/ecs.mjs';
import { NE_Key, NE_Action } from './numbers.mjs'

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

export class E_Action extends EventData {
    constructor(actText) {
        super();
        this.actText = actText;
    }
    getEventNum() {
        return NE_Action;
    }
    getActionText() {
        return this.actText;
    }
}

export class E_ActionInvoked extends E_Action {
}