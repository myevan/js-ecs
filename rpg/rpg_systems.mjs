import { System } from '../base/ecs.mjs';
import { Database } from '../base/db.mjs';

import { E_KeyPressed, E_ActionInvoked } from '../core/events.mjs';

import { NC_Identity, NC_Transform, NC_Landscape, NC_Stage } from '../core/numbers.mjs'
import { NE_Key, NK_Up, NK_Down, NK_Left, NK_Right } from '../core/numbers.mjs';

import { Component, Factory } from '../base/ecs.mjs';

class M_Repr {
    static get(chNum) {
        let db = Database.get();
        return db.getCachedMapper('Repr', [chNum], M_Repr);
    }
    constructor(record) {
        this.record = record;
        this.cc = record.getFieldValue('Cc');
        this.fg = record.getFieldValue('Fg');
        this.bg = record.getFieldValue('Bg');
    }
    getCc() {
        return this.cc;
    }
}

class C_Status extends Component {
    constructor() {
        super();
        this.curHp = 3; 
        this.maxHp = 3;
        this.atk = 1;
        this.def = 0;
    }
}

const NC_Status = 21;

export class S_Master extends System {
    constructor(world) {
        super(world)
        this.stage = null;
        this.landscape = null;
        this.world.factory.registerType(NC_Status, C_Status);

        let db = Database.get();
        let schemeMgr = db.getSchemeManager();
        let tableMgr = db.getTableManager();
        db.addTable(
            db.addScheme("Repr", ["RpNum", "Cc", "Fg", "Bg"], ["RpNum"]), 
            [
                [1, '@', '', ''],
                [2, 'm', '', ''],
            ]
        );

        db.addTable(
            db.addScheme("Char", ["ChNum", "SpecId", "MaxHp", "BaseAtk", "BaseDef"], ["ChNum"]), 
            [
                [100, 1, 5, 1, 0],
                [200, 2, 3, 1, 0],
            ]
        );
    }

    start() {
        this.landscape = this.world.getFirstComponent(NC_Landscape);
        this.world.infoLog(`지형[${this.landscape.getSeed()}]이 준비되었습니다.`);

        this.stage = this.world.getFirstComponent(NC_Stage);

        let regenCell2 = this.stage.popRegenCell();
        this.makeCharacter(regenCell2, 2, '', ['M']);

        let regenCell3 = this.stage.popRegenCell();
        this.makeCharacter(regenCell3, 2, '', ['M']);
        this.world.infoLog("몬스터들이 생성되었습니다.");

        let regenCell = this.stage.popRegenCell();
        this.makeCharacter(regenCell, 1, 'I', ['P']);
        this.world.infoLog("플레이어가 행동을 시작할 수 있습니다.");

        //this.world.sendEvent(new E_ActionInvoked("The master has prepared the characters."));
        //this.world.sendEvent(new E_ActionInvoked("マスターがキャラクターたちを準備しました。"));
    }

    makeCharacter(cell, rpNum, name="", tags=[]) {
        let repr = M_Repr.get(rpNum);
        let eid = this.world.spawn([NC_Identity, NC_Transform, NC_Status], name, tags);
        let ent = this.world.get(eid);
        let iden = ent.get(NC_Identity);
        iden.species = repr.getCc();

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
        this.status = null;
        this.landscape = null;
        this.world.bindEvent(NE_Key, this);
        this.isFirstKey = false;
    }

    start() {
        let ent = this.world.getNamedEntity("I");
        if (ent) {
            this.ent = ent;
            this.eid = ent.getEntityId();
            this.trans = ent.get(NC_Transform);
            this.status = ent.get(NC_Status);
            this.landscape = this.world.getFirstComponent(NC_Landscape);
            this.stage = this.world.getFirstComponent(NC_Stage);
        }
    }

    recvEvent(evData) {
        if (evData instanceof(E_KeyPressed)) {
            this.world.clearLogs();

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
            this.world.infoLog("플레이어가 이동 중 벽과 부딪혔습니다.");
            return;
        }
        let eidDst = this.stage.getEntity(posDst.x, posDst.y);
        if (eidDst) {
            let entDst = this.world.get(eidDst);
            let statusDst = entDst.get(NC_Status);
            if (statusDst) {
                statusDst.curHp -= this.status.atk;
                if (statusDst.curHp > 0) {
                    this.world.infoLog(`플레이어가 몬스터(남은 HP:${statusDst.curHp})를 공격했습니다.`);
                } else {
                    this.world.kill(eidDst);
                    this.stage.setEntity(posDst.x, posDst.y, 0);
                    this.world.infoLog("플레이어가 몬스터를 죽였습니다.");
                }
            } else {
                this.world.infoLog("플레이어가 무엇인가와 부딪혔습니다.");
            }
            return;
        }
        this.trans.pos = posDst;
        this.stage.setEntity(posSrc.x, posSrc.y, 0);
        this.stage.setEntity(posDst.x, posDst.y, this.eid);
    }
}