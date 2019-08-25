export class EventData {
    getEventNum() {
        return 0;
    }
}

class EventHandler {
    recvEvent(evtData) {
    }
}

class EventManager
{
    constructor() {
        this.evNumHandlers = new Map();
    }

    bindEvent(evNum, evHandler) {
        let foundHandlers = this.evNumHandlers.get(evNum);
        if (foundHandlers) {
            foundHandlers.push(evHandler);
        } else {
            this.evNumHandlers.set(evNum, [evHandler]);
        }
    }

    sendEvent(evData) {
        let evNum = evData.getEventNum();
        let foundHandlers = this.evNumHandlers.get(evNum);
        for (let foundHandler of foundHandlers) {
            foundHandler.recvEvent(evData);
        }
    }
}

export class Factory {
    constructor() {
        this.defCreate = null;
        this.numCreates = new Map();
    }

    registerDefault(defCreate) {
        this.defCreate = defCreate;
    }

    registerType(num, type) {
        this.numCreates.set(num, () => { return new type() });
    }

    create(num) {
        let numCreate = this.numCreates.get(num);
        if (numCreate) {
            return numCreate();
        } else {
            return this.defCreate();
        }
    }
}


export class Component {
    constructor() {
        this.eid = 0
        this.cpNum = 0
        this.nextComp = null;
        this.prevComp = null;
    }
    bind(cpNum, eid) {
        this.cpNum = cpNum;
        this.eid = eid;
    }
    getComponentNum() {
        return this.cpNum;
    }
    getEntityId() {
        return this.eid;
    }
    linkNext(newComp) {
        this.nextComp = newComp;
        newComp.prevComp = this;
    }
    linkPrev(newComp) {
        this.prevComp = newComp;
        newComp.nextComp = this;
    }
    unlink() {
        let prevComp = this.prevComp;
        let nextComp = this.nextComp;
        if (prevComp) {
            prevComp.nextComp = nextComp;
        }
        if (nextComp) {
            nextComp.prevComp = prevComp;
        }
        this.prevComp = null;
        this.nextComp = null;
    }
}

class ComponentList {
    constructor() {
        this.head = null;
        this.tail = null;
    }
    pushBack(newComp) {
        if (this.tail) {
            this.tail.linkNext(newComp);
            this.tail = newComp;
        } else {
            this.head = newComp;
            this.tail = newComp;
        }
    }
    peekBack() {
        return this.tail;
    }
    popBack(delComp) {
        if (this.tail) {
            let oldTail = this.tail;
            this.tail = oldTail.prevComp;
            oldTail.unlink();
            return oldTail;
        } else {
            return null;
        }
    }
    pushFront(newComp) {
        if (this.head) {
            this.head.linkPrev(newComp);
            this.head = newComp;
        } else {
            this.head = newComp;
            this.tail = newComp;
        }
    }
    peekFront() {
        return this.head;
    }
    popFront(delComp) {
        if (this.head) {
            let oldHead = this.head;
            this.head = oldHead.nextComp;
            oldHead.unlink();
            return oldHead;
        } else {
            return null;
        }
    }
    remove(dstComp) {
        if (this.head == dstComp) {
            this.popFront();
        } else if (this.tail == dstComp) {
            this.popBack();
        } else {
            dstComp.unlink();
        }
    }
    [Symbol.iterator]() {
        var curComp = this.head;

        return {
            next: () => {
                let retComp = curComp;
                if (curComp) {
                    curComp = curComp.nextComp;
                }
                return { value: retComp, done: !retComp };
            }
        };
    };
}

class ComponentStorage {
    constructor() {
        this.cpNumComps = new Map();
    }
    add(cpNum, srcComp) {
        let oldComps = this.cpNumComps.get(cpNum);
        if (oldComps) {
            oldComps.pushBack(srcComp);
        } else {
            let newComps = new ComponentList();
            newComps.pushBack(srcComp);
            this.cpNumComps.set(cpNum, newComps);
        }
    }
    remove(cpNum, dstComp) {
        let foundComps = this.cpNumComps.get(cpNum);
        if (foundComps) {
            foundComps.remove(dstComp);
        }
    }
    get(cpNum) {
        return this.cpNumComps.get(cpNum)
    }
}

export class Entity {
    constructor() {
        this.comps = new Map();
        this.tags = new Set();
        this.name = "";
        this.eid = 0;
    }
    reset() {
        if (this.comps) {
            this.comps.clear();
        }
        if (this.tags) {
            this.tags.clear();
        }
        if (this.name) {
            this.name = "";
        }
    }
    bind(eid) {
        this.eid = eid;
    }
    add(cpNum, newComp) {
        this.comps.set(cpNum, newComp);
    }
    get(cpNum) {
        return this.comps.get(cpNum);
    }
    setName(name) {
        this.name = name
    }
    getName() {
        return this.name;
    }
    addTag(tag) {
        this.tags.add(tag)
    }
    getTags() {
        return this.tags;
    }
    getComponents() {
        return this.comps.values();
    }
    getEntityId() {
        return this.eid;
    }
}

export class World extends EventManager {
    constructor(factory, entCap) {
        super();
        this.factory = factory;
        this.entCap = entCap;
        this.cpStorage = new ComponentStorage();
        this.ents = new Array(entCap);
        this.idxFrees = new Array();
        this.seqChecks = new Array(entCap);
        this.seqNext = 1;
        this.seqCap = 1000;
        this.idxBase = entCap;
        this.namedEnts = new Map();
        this.taggedEnts = new Map();
    }
    spawn(cpNums, name='', tags=[]) {
        if (this.idxFrees.length == 0) {
            this.idxFrees.push(this.ents.length);
            this.seqChecks.push(0);
            this.ents.push(new Entity());
        }

        let idxFree = this.idxFrees.pop();
        let seqCheck = this.seqNext;
        this.seqNext += 2;
        this.seqNext %= this.seqCap;

        let head = this.idxBase + idxFree;
        let tail = seqCheck;
        let eidRet = head * this.seqCap + tail;

        let ent = this.ents[idxFree];
        ent.bind(eidRet);

        for (let cpNum of cpNums) {
            let comp = this.factory.create(cpNum);
            comp.bind(cpNum, eidRet);
            ent.add(cpNum, comp);
            this.cpStorage.add(cpNum, comp);
        }
        this.seqChecks[idxFree] = seqCheck;

        if (name) {
            ent.setName(name);
            this.namedEnts.set(name, ent);
        }
        if (tags) {
            for (let tag of tags) {
                ent.addTag(tag);
                let oldEnts = this.taggedEnts.get(tag);
                if (oldEnts) {
                    oldEnts.set(eidRet, ent);
                } else {
                    let newEnts = new Map();
                    newEnts.set(eidRet, ent);
                    this.taggedEnts.set(tag, newEnts);
                }
            }
        }

        return eidRet;
    }
    kill(eid) {
        let idx = this._parse(eid);
        if (idx >= 0) {
            let ent = this.ents[idx];
            let name = ent.getName();
            if (name) {
                this.namedEnts.delete(name);
            }
            let tags = ent.getTags();
            if (tags) {
                for (let tag of tags) {
                    let foundEnts = this.taggedEnts.get(tag);
                    foundEnts.delete(eid);
                }
            }
            let comps = ent.getComponents();
            if (comps) {
                for (let comp of comps) {
                    let cpNum = comp.getComponentNum();
                    this.cpStorage.remove(cpNum, comp);
                }
            }
            ent.reset();

            this.idxFrees.push(idx);
        }
    }
    get(eid) {
        let idx = this._parse(eid);
        if (idx >= 0) {
            return this.ents[idx];
        } else {
            return null;
        }
    }
    _parse(eid) {
        let seqInput = eid % this.seqCap;
        let idxInput = ~~(eid / this.seqCap) - this.idxBase;
        let seqCheck = this.seqChecks[idxInput];
        if (seqInput == seqCheck) {
            return idxInput;
        } else {
            return -1;
        }
    }

    getComponents(cpNum) {
        return this.cpStorage.get(cpNum);
    }

    getFirstComponent(cpNum) {
        let foundComps = this.cpStorage.get(cpNum)
        if (foundComps) {
            return foundComps.peekFront();
        } else {
            return null;
        }
    }

    getNamedComponent(cpNum, name) {
        let ent = this.namedEnts.get(name);
        if (ent) {
            return ent.get(cpNum);
        } else {
            return null;
        }
    }

    getNamedEntity(name) {
        return this.namedEnts.get(name);
    }

    getTaggedEntities(tag) {
        return this.taggedEnts.get(tag);
    }
}

export class System extends EventHandler {
    constructor(world) {
        super();
        this.world = world;
    }

    start() {
    }

    update() {
    }
}

export class SystemManager {
    constructor() {
        this.systems = [];
    }

    add(system) {
        this.systems.push(system);
    }

    start() {
        for (let system of this.systems) {
            system.start();
        }
    }

    update() {
        for (let system of this.systems) {
            system.update();
        }
    }
}
