import { System } from '../base/ecs.mjs';
import { Database } from '../base/db.mjs';

import { E_KeyPressed } from '../core/events.mjs';

import { NC_Identity, NC_Transform, NC_Landscape, NC_Stage } from '../core/numbers.mjs'
import { NE_Key, NK_Up, NK_Down, NK_Left, NK_Right } from '../core/numbers.mjs';

import { C_Status } from './rpg_components.mjs';
import { NC_Status } from './rpg_numbers.mjs';

import { M_Char, M_Item } from './rpg_mappers.mjs';
import { DB_Repr, DB_Char, DB_Item } from './rpg_consts.mjs';

export class S_Master extends System {
    constructor(world) {
        super(world)
        this.stage = null;
        this.landscape = null;
        this.world.factory.registerType(NC_Status, C_Status);

        let db = Database.get();
        let schemeMgr = db.getSchemeManager();
        let tableMgr = db.getTableManager();
        db.addTable(db.addScheme("Repr", ["rpNum", "cc", "fg", "bg", "name", "desc"], ["rpNum"]), DB_Repr);
        db.addTable(db.addScheme("Char", ["chNum", "rpNum", "maxHp", "baseAtk", "baseDef"], ["chNum"]), DB_Char);
        db.addTable(db.addScheme("Item", ["itNum", "rpNum"], ["itNum"]), DB_Item);
    }

    start() {
        this.landscape = this.world.getFirstComponent(NC_Landscape);
        this.world.infoLog(`지형[${this.landscape.getSeed()}]이 준비되었습니다.`);

        this.stage = this.world.getFirstComponent(NC_Stage);

        let objCell = this.stage.popRegenCell();
        this.makeItem(objCell, 1001);

        let monCell1 = this.stage.popRegenCell();
        this.makeChar(monCell1, 310, ['M']);

        let monCell2 = this.stage.popRegenCell();
        this.makeChar(monCell2, 320, ['M']);
        this.world.infoLog("몬스터들이 생성되었습니다.");

        let regenCell = this.stage.popRegenCell();
        this.makeChar(regenCell, 100, ['P'], 'I');
        this.world.infoLog("플레이어가 움직일 수 있습니다.");

        //this.world.sendEvent(new E_ActionInvoked("The master has prepared the characters."));
        //this.world.sendEvent(new E_ActionInvoked("マスターがキャラクターたちを準備しました。"));
    }

    makeChar(cell, chNum, tags=[], name="") {
        let char = M_Char.get(chNum);
        let repr = char.getRepr();
        let eid = this.world.spawn([NC_Identity, NC_Transform, NC_Status], name, tags);
        let ent = this.world.get(eid);
        let iden = ent.get(NC_Identity);
        iden.cc = repr.cc;

        let trans = ent.get(NC_Transform);
        trans.pos = cell.toPosition();

        let status = ent.get(NC_Status);
        status.setCharMapper(char);

        this.stage.setEntity(cell.x, cell.y, eid);
        return eid;
    }

    makeItem(cell, obNum) {
        let obj = M_Item.get(obNum);
        let repr = obj.getRepr();
        let eid = this.world.spawn([NC_Identity, NC_Transform]);
        let ent = this.world.get(eid);
        let iden = ent.get(NC_Identity);
        iden.cc = repr.cc;

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