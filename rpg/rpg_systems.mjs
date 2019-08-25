import { System } from '../base/ecs.mjs';
import { Database } from '../base/db.mjs';

import { E_KeyPressed, E_ActionInvoked } from '../core/events.mjs';

import { NC_Identity, NC_Transform, NC_Landscape, NC_Stage } from '../core/numbers.mjs'
import { NE_Key, NK_Up, NK_Down, NK_Left, NK_Right } from '../core/numbers.mjs';

import { Component, Factory } from '../base/ecs.mjs';

class M_Repr {
    static get(rpNum) {
        let db = Database.get();
        return db.getCachedMapper('Repr', [rpNum], M_Repr);
    }
    constructor(record) {
        this.record = record;
        this.cc = record.getFieldValue('cc');
        this.fg = record.getFieldValue('fg');
        this.bg = record.getFieldValue('bg');
    }
}

class M_Char {
    static get(chNum) {
        let db = Database.get();
        return db.getCachedMapper('Char', [chNum], M_Char);
    }
    constructor(record) {
        this.record = record;
        this.rpNum = record.getFieldValue('rpNum');
        this.maxHp = record.getFieldValue('maxHp');
        this.baseAtk = record.getFieldValue('baseAtk');
        this.baseDef = record.getFieldValue('baseDef');
        this.repr = M_Repr.get(this.rpNum);
    }
    getRepr() {
        return this.repr;
    }
}

class C_Status extends Component {
    constructor() {
        super();
        this.char = null;
        this.curHp = 0; 
        this.maxHp = 0;
        this.atk = 0;
        this.def = 0;
    }

    setCharacterMapper(char) {
        this.char = char;
        this.curHp = char.maxHp; 
        this.maxHp = char.maxHp;
        this.atk = char.baseAtk;
        this.def = char.baseAtk;
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
            db.addScheme("Repr", ["rpNum", "cc", "fg", "bg"], ["rpNum"]), 
            [
                [1, '@', '', ''],
                [2, 'h', '', ''],
                [3, 'm', '', ''],
            ]
        );

        db.addTable(
            db.addScheme("Char", ["chNum", "rpNum", "maxHp", "baseAtk", "baseDef"], ["chNum"]), 
            [
                [100, 1, 5, 1, 0],
                [300, 3, 3, 1, 0],
            ]
        );
    }

    start() {
        this.landscape = this.world.getFirstComponent(NC_Landscape);
        this.world.infoLog(`지형[${this.landscape.getSeed()}]이 준비되었습니다.`);

        this.stage = this.world.getFirstComponent(NC_Stage);

        let regenCell2 = this.stage.popRegenCell();
        this.makeCharacter(regenCell2, 300, '', ['M']);

        let regenCell3 = this.stage.popRegenCell();
        this.makeCharacter(regenCell3, 300, '', ['M']);
        this.world.infoLog("몬스터들이 생성되었습니다.");

        let regenCell = this.stage.popRegenCell();
        this.makeCharacter(regenCell, 100, 'I', ['P']);
        this.world.infoLog("플레이어가 행동을 시작할 수 있습니다.");

        //this.world.sendEvent(new E_ActionInvoked("The master has prepared the characters."));
        //this.world.sendEvent(new E_ActionInvoked("マスターがキャラクターたちを準備しました。"));
    }

    makeCharacter(cell, chNum, name="", tags=[]) {
        let char = M_Char.get(chNum);
        let repr = char.getRepr();
        let eid = this.world.spawn([NC_Identity, NC_Transform, NC_Status], name, tags);
        let ent = this.world.get(eid);
        let iden = ent.get(NC_Identity);
        iden.cc = repr.cc;

        let trans = ent.get(NC_Transform);
        trans.pos = cell.toPosition();

        let status = ent.get(NC_Status);
        status.setCharacterMapper(char);

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