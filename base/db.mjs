class Scheme {
    constructor(name, fields=[], pks=[]) {
        this.name = name;
        this.fields = fields;
        this.pkIdxs = new Array(pks.length);
        for (let i = 0; i != pks.length; ++i) {
            this.pkIdxs[i] = fields.indexOf(pks[i]);
        }
        this.fieldIdxs = new Map();
        for (let i = 0; i != fields.length; ++i) {
            this.fieldIdxs.set(fields[i], i);
        }
    }
    getNamedFieldIndex(name) {
        return this.fieldIdxs.get(name);
    }
}

class SchemeManager {
    constructor() {
        this.schemes = new Map();
    }

    add(scheme) {
        this.schemes.set(scheme.name, scheme);
        return scheme;
    }
}

class Field {
    constructor(value) {
        this.value = value;
    }
    getValue() {
        return this.value;
    }
}

class Record {
    constructor(scheme, fields) {
        this.scheme = scheme;
        this.fields = new Array(fields.length);
        for (let i = 0; i != fields.length; ++i) {
            this.fields[i] = new Field(fields[i]);
        }
    }
    getField(name) {
        let idx = this.scheme.getNamedFieldIndex(name);
        return this.fields[idx];
    }
    getFieldAt(idx) {
        return this.fields[idx];
    }
    getFieldValue(name) {
        let idx = this.scheme.getNamedFieldIndex(name);
        return this.fields[idx].getValue();
    }
    getFieldValuesAt(idxs) {
        let retValues = new Array(idxs.length);
        for (let idx of idxs) {
            let field = this.fields[idx];
            retValues[idx] = field.getValue();
        }
        return retValues;
    }
}

class Table {
    constructor(scheme, records) {
        this.scheme = scheme;

        this.records = new Array(records.length);
        for (let i = 0; i != records.length; ++i) {
            this.records[i] = new Record(scheme, records[i]);
        }

        this.pkRecords = new Map();
        if (this.scheme.pkIdxs) {
            for (let record of this.records) {
                let pkVals = record.getFieldValuesAt(this.scheme.pkIdxs);
                let key = pkVals.join(',');
                this.pkRecords.set(key, record);
            }
        }
    }
    get(pkVals) {
        let key = pkVals.join(',');
        return this.pkRecords.get(key);
    }
}

class TableManager {
    constructor() {
        this.tables = new Map();
    }

    add(table) {
        this.tables.set(table.scheme.name, table);
        return table;
    }
    get(name) {
        return this.tables.get(name);
    }
}

export class Database {
    static inst;

    static get() {
        if (!Database.inst) {
            Database.inst = new Database();
        }
        return Database.inst;
    }

    constructor() {
        this.schemeMgr = new SchemeManager();
        this.tableMgr = new TableManager();
    }

    addScheme(name, fields, pks) {
        return this.schemeMgr.add(new Scheme(name, fields, pks));
    }

    addTable(scheme, records) {
        return this.tableMgr.add(new Table(scheme, records));
    }

    getTable(name) {
        return this.tableMgr.get(name);
    }

    getRecord(name, pkVals) {
        let table = this.tableMgr.get(name);
        return table.get(pkVals);
    }

    getSchemeManager() {
        return this.schemeMgr;
    }

    getTableManager() {
        return this.tableMgr;
    }
}
