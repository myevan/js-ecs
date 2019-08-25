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

class M_Item {
    static get(itNum) {
        let db = Database.get();
        return db.getCachedMapper('Item', [itNum], M_Item);
    }
    constructor(record) {
        this.record = record;
        this.rpNum = record.getFieldValue('rpNum');
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

    setCharMapper(char) {
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
            db.addScheme("Repr", ["rpNum", "cc", "fg", "bg", "devName", "outName"], ["rpNum"]), 
            [
                [1, ",", "", "", "drop", "드롭"],
                [2, "-", "", "", "stick", "막대"],
                [3, "o", "", "", "rock", "돌"],
                [4, "*", "", "", "jewel", "보석"],
                [5, "#", "", "", "metal", "금속"],
                [6, "%", "", "", "food", "식량"],
                [7, "?", "", "", "box", "상자"],
                [8, "+", "", "", "equip", "장비"],
                [9, "!", "", "", "artifact", "아티팩트"],
                [10, "@", "", "", "hero", "영웅"],
                [11, "h", "", "", "human", "인간"],
                [12, "d", "", "", "dwarf", "드워프"],
                [13, "e", "", "", "elf", "엘프"],
                [14, "x", "", "", "pixie", "픽시"],
                [15, "m", "", "", "daemon", "데몬"],
                [16, "V", "", "", "Devil", "데빌"],
                [17, "A", "", "", "Angel", "엔젤"],
                [18, "G", "", "", "Giant", "자이언트"],
                [19, "D", "", "", "Dragon", "드래곤"],
                [21, "i", "", "", "chicken", "닭"],
                [22, "c", "", "", "cat", "고양이"],
                [23, "d", "", "", "dog", "개"],
                [24, "p", "", "", "pig", "돼지"],
                [25, "u", "", "", "bull", "소"],
                [26, "&", "", "", "horse", "말"],
                [27, "∫", "", "", "sheep", "양"],
                [28, "`", "", "", "deer", "사슴"],
                [29, "^", "", "", "bird", "새"],
                [31, "a", "", "", "rat", "쥐"],
                [32, "r", "", "", "rabbit", "토끼"],
                [33, "s", "", "", "snake", "뱀"],
                [34, "w", "", "", "wolf", "늑대"],
                [35, "b", "", "", "boar", "멧돼지"],
                [36, "t", "", "", "tiger", "호랑이"],
                [39, "F", "", "", "griffin", "그리핀"],
                [41, "k", "", "", "skeleton", "스켈레톤"],
                [42, "z", "", "", "zombie", "좀비"],
                [43, ":", "", "", "ghost", "유령"],
                [48, "v", "", "", "vampire", "뱀파이어"],
                [49, "L", "", "", "Lich", "리치"],
                [51, "g", "", "", "goblin", "고블린"],
                [52, ";", "", "", "scorpion", "스콜피온"],
                [53, "o", "", "", "orc", "오크"],
                [55, "C", "", "", "cockatrice", "코카트리스"],
                [56, "O", "", "", "Orge", "오거"],
                [57, "R", "", "", "Roc", "로크"],
                [58, "Y", "", "", "Cyclopse", "사이클롭스"],
                [59, "X", "", "", "Phoneix", "피닉스"],
                [61, "i", "", "", "imp", "임프"],
                [62, "y", "", "", "harpy", "하피"],
                [67, "B", "", "", "Beholder", "비홀더"],
                [69, "M", "", "", "Minotaur", "미노타우로스"],
                [71, "E", "", "", "Elemental", "엘리멘탈(화)"],
                [72, "E", "", "", "Elemental", "엘리멘탈(수)"],
                [73, "E", "", "", "Elemental", "엘리멘탈(풍)"],
                [74, "E", "", "", "Elemental", "엘리멘탈(지)"],
                [76, "T", "", "", "Trent", "트렌트"],
                [78, "P", "", "", "Pegasus", "페가수스"],
                [79, "U", "", "", "Unicorn", "유니콘"],
                [81, "n", "", "", "gnoll", "놀"],
                [82, "l", "", "", "lizardman", "리자드맨"],
                [85, "K", "", "", "Basilisk", "바실리스크"],
                [89, "H", "", "", "Hydra", "히드라"],
                [91, "g", "", "", "gremlin", "그렘린"],
                [92, "y", "", "", "gargoyle", "가고일"],
                [93, "q", "", "", "golem", "골렘(흙)"],
                [94, "q", "", "", "golem", "골렘(철)"],
                [95, "Q", "", "", "golem", "골렘(불)"],
                [96, "W", "", "", "Wyvern", "와이번"],
                [97, "I", "", "", "Genie", "지니"],
                [98, "N", "", "", "Naga", "나가"],
                [99, "T", "", "", "Titan", "타이탄"],
            ]
        );

        db.addTable(
            db.addScheme("Char", ["chNum", "rpNum", "maxHp", "baseAtk", "baseDef"], ["chNum"]), 
            [
                [100, 10, 5, 1, 0],
                [310, 15, 3, 1, 0],
                [320, 69, 8, 1, 0],
            ]
        );

        db.addTable(
            db.addScheme("Item", ["itNum", "rpNum"], ["itNum"]), 
            [
                [1001, 7],
            ]
        );
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