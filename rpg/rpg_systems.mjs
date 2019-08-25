import { System } from '../base/ecs.mjs';

import { E_KeyPressed, E_ActionInvoked } from '../core/events.mjs';

import { NC_Identity, NC_Transform, NC_Landscape, NC_Stage } from '../core/numbers.mjs'
import { NE_Key, NK_Up, NK_Down, NK_Left, NK_Right } from '../core/numbers.mjs';

import { Component, Factory } from '../base/ecs.mjs';

class C_Health extends Component {
    constructor() {
        super();
        this.cur = 3; 
        this.cap = 3;
    }
}

const NC_Health = 21;

export class S_Master extends System {
    constructor(world) {
        super(world)
        this.stage = null;
        this.world.factory.registerType(NC_Health, C_Health);
    }

    start() {
        this.stage = this.world.getFirstComponent(NC_Stage);
        let regenCell = this.stage.popRegenCell();
        this.makeCharacter(regenCell, '@', 'I', ['P']);

        let regenCell2 = this.stage.popRegenCell();
        this.makeCharacter(regenCell2, 'm', '', ['M']);

        let regenCell3 = this.stage.popRegenCell();
        this.makeCharacter(regenCell3, 'm', '', ['M']);

        //this.world.sendEvent(new E_ActionInvoked("The master has prepared the characters."));
        this.world.sendEvent(new E_ActionInvoked("마스터가 캐릭터들을 준비 했습니다."));
        //this.world.sendEvent(new E_ActionInvoked("マスターがキャラクターたちを準備しました。"));
    }

    makeCharacter(cell, species, name="", tags=[]) {
        let eid = this.world.spawn([NC_Identity, NC_Transform, NC_Health], name, tags);
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
            this.eid = ent.getEntityId();
            this.trans = ent.get(NC_Transform);
            this.landscape = this.world.getFirstComponent(NC_Landscape);
            this.stage = this.world.getFirstComponent(NC_Stage);
        }
    }

    recvEvent(evData) {
        if (evData instanceof(E_KeyPressed)) {
            let num = evData.getKeyNum();

            if (num == NK_Up) {
                this.move(0, -1);
            }
            else if (num == NK_Down) {
                this.move(0, +1);
            }
            else if (num == NK_Left) {
                this.move(-1, 0);
            }
            else if (num == NK_Right) {
                this.move(+1, 0);
            }
        }
    }

    move(dx, dy) {
        let posSrc = this.trans.pos;
        let posDst = this.trans.pos.plus(dx, dy);
        if (this.landscape.isWall(posDst.x, posDst.y)) {
            this.world.sendEvent(new E_ActionInvoked("플레이어가 벽과 부딪혔습니다."))
            return;
        }
        let eidDst = this.stage.getEntity(posDst.x, posDst.y);
        if (eidDst) {
            let entDst = this.world.get(eidDst);
            let healthDst = entDst.get(NC_Health);
            if (healthDst) {
                healthDst.cur -= 1;
                if (healthDst.cur > 0) {
                    this.world.sendEvent(new E_ActionInvoked(`플레이어가 몬스터(남은 HP:${healthDst.cur})를 공격했습니다.`))
                } else {
                    this.world.kill(eidDst);
                    this.stage.setEntity(posDst.x, posDst.y, 0);
                    this.world.sendEvent(new E_ActionInvoked("플레이어가 몬스터를 죽였습니다."))
                }
            } else {
                this.world.sendEvent(new E_ActionInvoked("플레이어가 무엇인가와 부딪혔습니다."))
            }
            return;
        }
        this.trans.pos = posDst;
        this.stage.setEntity(posSrc.x, posSrc.y, 0);
        this.stage.setEntity(posDst.x, posDst.y, this.eid);
    }
}