import { System } from '../base/ecs.mjs';
import { Cell } from '../base/primitives.mjs'

import { E_KeyPressed } from './events.mjs';

import { NC_Identity, NC_Transform, NC_TextScreen, NC_Landscape, NC_Stage } from './components.mjs'
import { NE_KeyEvent, NK_Up, NK_Down, NK_Left, NK_Right } from './events.mjs';

export class S_RotRandomMapGenrator extends System {
    constructor(rot, world) {
        super(world);
        this.rot = rot;
    }

    start() {
        this._makeLandscapeDungeon();
    }

    _makeLandscapeDungeon() {
        let eid = this.world.spawn([NC_Landscape, NC_Stage, NC_TextScreen]);
        let ent = this.world.get(eid);
        let landscape = ent.get(NC_Landscape);
        let movableCells = [];
        let digger = new this.rot.Map.Digger();
        var digCallback = function(x, y, value) {
            landscape.setTile(x, y, value);
            if (value == 0) {
                movableCells.push(new Cell(x, y, value));
            }
        }
        digger.create(digCallback.bind(this));

        let stage = ent.get(NC_Stage);
        let regenCells = this.rot.RNG.shuffle(movableCells);
        this._makeCharacter(stage, regenCells.pop(), '@');
    }

    _makeCharacter(stage, cell, species) {
        let eid = this.world.spawn([NC_Identity, NC_Transform]);
        let ent = this.world.get(eid);
        let iden = ent.get(NC_Identity);
        iden.species = species;

        let trans = ent.get(NC_Transform);
        trans.pos = cell.toPosition();

        stage.set(cell.x, cell.y, eid);
        return eid;
    }
}

export class S_RotView extends System {
    constructor(rot, world, display) {
        super(world);
        this.rot = rot;
        this.display = display;
    }

    start() {
        this._render();
    }

    update() {
        this._render();
    }

    _render() {
        let screen = this.world.getFirstComponent(NC_TextScreen);
        let height = screen.getHeight();
        let width = screen.getWidth();

        for (let y = 0; y != height; ++y) {
            for (let x = 0; x != width; ++x) {
                let ch = screen.get(x, y);
                this.display.draw(x, y, ch);
            }
        }
    }
}

export class S_TextView extends System {
    static fullMask = parseInt("111" + "111" + "111", 2);
    static patternChars = new Map([
        [parseInt("111" + "111" + "111", 2), ' '], // 9
        [parseInt("111" + "111" + "110", 2), '┌'], // 8
        [parseInt("110" + "111" + "111", 2), '└'], // 8
        [parseInt("111" + "111" + "011", 2), '┐'], // 8
        [parseInt("011" + "111" + "111", 2), '┘'], // 8
        [parseInt("010" + "011" + "010", 2), '├'], // 4
        [parseInt("010" + "110" + "010", 2), '┤'], // 4
        [parseInt("000" + "111" + "010", 2), '┬'], // 4
        [parseInt("010" + "111" + "000", 2), '┴'], // 4
        [parseInt("010" + "111" + "010", 2), '┼'], // 4
        [parseInt("000" + "111" + "000", 2), '─'], // 3
        [parseInt("010" + "010" + "010", 2), '│'], // 3
    ]);
    static wallMaskChars = [
        //[parseInt("111" + "111" + "111", 2), ' '], // 9
        //[parseInt("111" + "111" + "110", 2), '┌'], // 8
        //[parseInt("110" + "111" + "111", 2), '└'], // 8
        //[parseInt("111" + "111" + "011", 2), '┐'], // 8
        //[parseInt("011" + "111" + "111", 2), '┘'], // 8
        [parseInt("110" + "110" + "110", 2), '│'], // 6
        [parseInt("011" + "011" + "011", 2), '│'], // 6
        [parseInt("000" + "111" + "111", 2), '─'], // 6
        [parseInt("111" + "111" + "000", 2), '─'], // 6
        [parseInt("010" + "111" + "010", 2), '┼'], // 4
        [parseInt("000" + "111" + "010", 2), '┬'], // 4
        [parseInt("010" + "111" + "000", 2), '┴'], // 4
        [parseInt("010" + "011" + "010", 2), '├'], // 4
        [parseInt("010" + "110" + "010", 2), '┤'], // 4
        [parseInt("010" + "010" + "010", 2), '│'], // 3
        [parseInt("000" + "111" + "000", 2), '─'], // 3
        [parseInt("000" + "011" + "010", 2), '┌'], // 3
        [parseInt("010" + "011" + "000", 2), '└'], // 3
        [parseInt("000" + "110" + "010", 2), '┐'], // 3
        [parseInt("010" + "110" + "000", 2), '┘'], // 3
        [parseInt("000" + "110" + "000", 2), '─'], // 2
        [parseInt("010" + "010" + "000", 2), '│'], // 2
        [parseInt("000" + "010" + "010", 2), '│'], // 2
        [parseInt("000" + "011" + "000", 2), '─'], // 2
        [parseInt("000" + "010" + "000", 2), '1'],
    ];
    static spaceMaskChars = [
        [parseInt("000" + "010" + "000", 2), '·'],
    ];

    start() {
        this._render();
    }

    update() {
        this._render();
    }

    _render() {
        let screen = this.world.getFirstComponent(NC_TextScreen);
        let height = screen.getHeight();
        let width = screen.getWidth();

        let landscape = this.world.getFirstComponent(NC_Landscape);
        for (let y = 0; y != height; ++y) {
            for (let x = 0; x != width; ++x) {
                let ch = this._getLandscapeChar(landscape, x, y)
                screen.set(x, y, ch);
            }
        }

        let idens = this.world.getComponents(NC_Identity);
        for (let iden of idens) {
            let ent = this.world.get(iden.eid);
            let trans = ent.get(NC_Transform);
            let ch = this._getIdentityChar(iden)
            screen.set(trans.pos.x, trans.pos.y, ch);
        }
    }

    _getLandscapeChar(landscape, x, y) {
        let pattern = 0
        if (landscape.isWall(x - 1, y - 1)) {pattern |= 1<<8;}
        if (landscape.isWall(x    , y - 1)) {pattern |= 1<<7;}
        if (landscape.isWall(x + 1, y - 1)) {pattern |= 1<<6;}
        if (landscape.isWall(x - 1, y    )) {pattern |= 1<<5;}
        if (landscape.isWall(x    , y    )) {pattern |= 1<<4;}
        if (landscape.isWall(x + 1, y    )) {pattern |= 1<<3;}
        if (landscape.isWall(x - 1, y + 1)) {pattern |= 1<<2;}
        if (landscape.isWall(x    , y + 1)) {pattern |= 1<<1;}
        if (landscape.isWall(x + 1, y + 1)) {pattern |= 1<<0;}

        let patternChar = S_TextView.patternChars.get(pattern);
        if (patternChar) {
            return patternChar;
        }

        for (let [mask, ch] of S_TextView.wallMaskChars) {
            let val = pattern & mask;
            if (val == mask) {
                return ch;
            }
        }

        let revPattern = S_TextView.fullMask - pattern;
        for (let [mask, ch] of S_TextView.spaceMaskChars) {
            let val = revPattern & mask;
            if (val == mask) {
                return ch;
            }
        }

        return '?';
    }

    _getIdentityChar(iden) {
        return iden.species;
    }
}

export class S_ConsoleView extends System {
    start() {
        let screen = this.world.getFirstComponent(NC_TextScreen);
        let height = screen.getHeight();
        let width = screen.getWidth();
        let chars = new Array(width);
        for (let y = 0; y != height; ++y) {
            for (let x = 0; x != width; ++x) {
                chars[x] = screen.get(x, y);
            }
            let line = chars.join('');
            console.log(line);
        }
    }
}

export class S_Player extends System {
    constructor(world) {
        super(world);
        this.ent = null;
        this.trans = null;
        this.landscape = null;
        this.world.bindEvent(NE_KeyEvent, this);
    }

    start() {
        let ent = this._findPC();
        if (ent) {
            this.ent = ent;
            this.trans = ent.get(NC_Transform);
            this.landscape = this.world.getFirstComponent(NC_Landscape);
        }
    }

    _findPC() {
        let idens = this.world.getComponents(NC_Identity);
        for (let iden of idens) {
            let ent = this.world.get(iden.eid);
            let trans = ent.get(NC_Transform);
            if (iden.species == '@') {
                return ent;
            }
        }
        return null;
    }

    recvEvent(evData) {
        if (evData instanceof(E_KeyPressed)) {
            let knum = evData.getKeyNum();

            if (knum == NK_Up) {
                this._move(0, -1);
            }
            else if (knum == NK_Down) {
                this._move(0, +1);
            }
            else if (knum == NK_Left) {
                this._move(-1, 0);
            }
            else if (knum == NK_Right) {
                this._move(+1, 0);
            }
        }
    }

    _move(dx, dy) {
        let oldPos = this.trans.pos;
        let newPos = this.trans.pos.plus(dx, dy);
        if (this.landscape.isWall(newPos.x, newPos.y)) {
            return;
        }
        this.trans.pos = newPos;
    }
}
