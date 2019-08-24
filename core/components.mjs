import { Component, Factory } from '../base/ecs.mjs';
import { Environment } from '../base/environment.mjs';
import { Position, Rotation, ValueMap } from '../base/primitives.mjs'

import { NC_Identity, NC_Transform, NC_Landscape, NC_Stage, NC_TextScreen } from './numbers.mjs'

class C_Identity extends Component {
    constructor() {
        super();
        this.species = "";
        this.name = "";
    }
}

class C_Transform extends Component {
    constructor() {
        super();
        this.pos = new Position();
        this.rot = new Rotation();
    }
}

class C_Landscape extends Component {
    constructor() {
        super();

        let env = Environment.get();
        let tileMap = new ValueMap(env.getScreenWidth(), env.getScreenHeight());
        tileMap.fill(1);
        //tileMap.set(1, 1, 0);
        //tileMap.set(2, 2, 0);
        this.tileMap = tileMap;
        this.seed = -1;
    }

    setSeed(seed) {
        this.seed = seed;
    }

    setTile(x, y, value) {
        this.tileMap.set(x, y, value);
    }

    isWall(x, y) {
        if (x >= 0 && y >= 0 && x < this.tileMap.width && y < this.tileMap.height) {
            return this.tileMap.get(x, y) ? true : false;
        } else {
            return true;
        }
    }
}

class C_Stage extends Component {
    constructor() {
        super();

        let env = Environment.get();
        let eidMap = new ValueMap(env.getScreenWidth(), env.getScreenHeight());
        eidMap.fill(0);
        this.eidMap = eidMap;
        this.movCells = [];
        this.regenCells = [];
    }

    setEntity(x, y, eid) {
        this.eidMap.set(x, y, eid);
    }

    getEntity(x, y) {
        return this.eidMap.get(x, y);
    }

    setMovableCells(movCells) {
        this.movCells = movCells;
    }

    setRegenCells(regenCells) {
        this.regenCells = regenCells;
    }

    popRegenCell() {
        return this.regenCells.pop();
    }

}

class C_TextScreen extends Component {
    constructor() {
        super();

        let env = Environment.get();
        let chMap = new ValueMap(env.getScreenWidth(), env.getScreenHeight());
        chMap.fill(' ');
        this.chMap = chMap;
    }

    set(x, y, ch) {
        this.chMap.set(x, y, ch);
    }

    get(x, y) {
        return this.chMap.get(x, y);
    }

    getWidth() {
        return this.chMap.getWidth();
    }

    getHeight() {
        return this.chMap.getHeight();
    }
}

export class C_Factory extends Factory {
    static inst;
    static get() {
        if (!C_Factory.inst) {
            C_Factory.inst = new C_Factory();
        }
        return C_Factory.inst; 
    }
    constructor() {
        super();

        this.registerType(NC_Identity, C_Identity);
        this.registerType(NC_Transform, C_Transform);
        this.registerType(NC_TextScreen, C_TextScreen);
        this.registerType(NC_Landscape, C_Landscape);
        this.registerType(NC_Stage, C_Stage);
    }
}
