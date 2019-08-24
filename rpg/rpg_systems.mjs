import { System } from '../base/ecs.mjs';

import { E_KeyPressed, E_ActionInvoked } from '../core/events.mjs';

import { NC_Identity, NC_Transform, NC_Landscape, NC_Stage } from '../core/numbers.mjs'
import { NE_Key, NK_Up, NK_Down, NK_Left, NK_Right } from '../core/numbers.mjs';

export class S_Master extends System {
    constructor(world) {
        super(world)
        this.stage = null;
    }

    start() {
        this.stage = this.world.getFirstComponent(NC_Stage);
        let regenCell = this.stage.popRegenCell();
        this.makeCharacter(regenCell, '@', 'I', ['P']);

        let regenCell2 = this.stage.popRegenCell();
        this.makeCharacter(regenCell2, 'm', '', ['M']);

        //this.world.sendEvent(new E_ActionInvoked("こんにちは"));
        this.world.sendEvent(new E_ActionInvoked("안녕하세요."));
    }

    makeCharacter(cell, species, name="", tags=[]) {
        let eid = this.world.spawn([NC_Identity, NC_Transform], name, tags);
        let ent = this.world.get(eid);
        let iden = ent.get(NC_Identity);
        iden.species = species;

        let trans = ent.get(NC_Transform);
        trans.pos = cell.toPosition();

        this.stage.setEntity(cell.x, cell.y, eid);
        return eid;
    }
}

export class S_Player extends System {
    constructor(world) {
        super(world);
        this.ent = null;
        this.trans = null;
        this.landscape = null;
        this.world.bindEvent(NE_Key, this);
    }

    start() {
        let ent = this.world.getNamedEntity("I");
        if (ent) {
            this.ent = ent;
            this.trans = ent.get(NC_Transform);
            this.landscape = this.world.getFirstComponent(NC_Landscape);
        }
    }

    recvEvent(evData) {
        if (evData instanceof(E_KeyPressed)) {
            let num = evData.getKeyNum();

            if (num == NK_Up) {
                this._move(0, -1);
            }
            else if (num == NK_Down) {
                this._move(0, +1);
            }
            else if (num == NK_Left) {
                this._move(-1, 0);
            }
            else if (num == NK_Right) {
                this._move(+1, 0);
            }
        }
    }

    _move(dx, dy) {
        let oldPos = this.trans.pos;
        let newPos = this.trans.pos.plus(dx, dy);
        if (this.landscape.isWall(newPos.x, newPos.y)) {
            this.world.sendEvent(new E_ActionInvoked("Player:collision!"))
            return;
        }
        this.trans.pos = newPos;
    }
}