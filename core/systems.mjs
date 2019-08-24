import { System } from '../base/ecs.mjs';

import { E_KeyPressed } from './events.mjs';

import { NC_Identity, NC_Transform, NC_TextScreen, NC_Landscape } from './numbers.mjs'
import { NE_KeyEvent, NK_Up, NK_Down, NK_Left, NK_Right } from './numbers.mjs';

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
