import { Component } from '../base/ecs.mjs';

export class C_Status extends Component {
    constructor() {
        super();
        this.char = null;
        this.curHp = 0; 
        this.maxHp = 0;
        this.atk = 0;
        this.def = 0;
    }

    setCharMapper(char) {
        this.char = char;
        this.curHp = char.maxHp; 
        this.maxHp = char.maxHp;
        this.atk = char.baseAtk;
        this.def = char.baseAtk;
    }
}
