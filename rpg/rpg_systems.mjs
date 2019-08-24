import { System } from '../base/ecs.mjs';

import { E_KeyPressed } from '../core/events.mjs';

import { NC_Identity, NC_Transform, NC_Landscape } from '../core/numbers.mjs'
import { NE_Key, NK_Up, NK_Down, NK_Left, NK_Right } from '../core/numbers.mjs';

export class S_Player extends System {
    constructor(world) {
        super(world);
        this.ent = null;
        this.trans = null;
        this.landscape = null;
        this.world.bindEvent(NE_Key, this);
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