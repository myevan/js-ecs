import { Database } from '../base/db.mjs';

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

export class M_Char {
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

export class M_Item {
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
