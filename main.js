let rot = require('rot-js');
let keypress = require('keypress');

class Environment {
    static inst = null;

    static get() {
        if (!Environment.inst) {
            Environment.inst = new Environment();
        }
        return Environment.inst;
    }

    constructor() {
        let stdout = process.stdout;
        if (stdout._type == 'tty') {
            this.screenMode = 'TTY'
            this.screenWidth = stdout.columns
            this.screenHeight = stdout.rows
        } else {
            this.screenMode = ''
            this.screenWidth = 80;
            this.screenHeight = 25;
        }
    }

    getScreenWidth() {
        return this.screenWidth;
    }

    getScreenHeight() {
        return this.screenHeight;
    }
}

class Factory {
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

class Component {
    constructor() {
        this.eid = 0
        this.nextComp = null;
        this.prevComp = null;
    }
    bind(eid) {
        this.eid = eid;
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
        prevComp = this.prevComp;
        nextComp = this.nextComp;
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
        this.cnumComps = new Map();
    }
    add(cnum, newComp) {
        let oldComps = this.cnumComps.get(cnum);
        if (oldComps) {
            oldComps.pushBack(newComp);
        } else {
            let newComps = new ComponentList();
            newComps.pushBack(newComp);
            this.cnumComps.set(cnum, newComps);
        }
    }
    get(cnum) {
        return this.cnumComps.get(cnum)
    }
}

class Entity {
    constructor() {
        this.comps = new Map();
        this.tags = new Set();
        this.name = "";
    }
    reset() {
        if (this.comps) {
            for (let [cid, comp] of this.comps) {
                comp.unlink();
            }
            this.comps.clear();
        }
        if (this.tags) {
            this.tags.clear();
        }
        if (this.name) {
            this.name = "";
        }
    }
    add(cid, newComp) {
        this.comps[cid] = newComp;
    }
    get(cid) {
        return this.comps[cid];
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
}

class World {
    constructor(factory, entCap) {
        this.factory = factory;
        this.entCap = entCap;
        this.cnumComps = new ComponentStorage();
        this.ents = new Array(entCap);
        this.idxFrees = new Array();
        this.seqChecks = new Array(entCap);
        this.seqNext = 1;
        this.seqCap = 1000;
        this.idxBase = entCap;
        this.namedEnts = new Map();
        this.taggedEnts = new Map();
    }
    spawn(cnums, name='', tags=[]) {
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
        for (let cnum of cnums) {
            let comp = this.factory.create(cnum);
            comp.bind(eidRet);
            ent.add(cnum, comp);
            this.cnumComps.add(cnum, comp);
        }
        this.seqChecks[idxFree] = seqCheck;

        if (name) {
            ent.setName(name);
            this.namedEnts.set(name, ent);
        }
        if (tags) {
            for (let tag of tags) {
                ent.addTag(add);
                oldEnts = this.taggedEnts.get(name);
                if (oldEnts) {
                    oldEnts.push(ent);
                } else {
                    let newEnts = new Set();
                    newEnts.add(ent);
                    this.taggedEnts.set(name, newEnts);
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
            let tags = ent.getTag();
            if (tags) {
                for (let tag of tags) {
                    let foundEnts = this.taggedEnts.get(tag);
                    foundEnts.delete(ent);
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

    getComponents(cnum) {
        return this.cnumComps.get(cnum);
    }

    getFirstComponent(cnum) {
        let foundComps = this.cnumComps.get(cnum)
        if (foundComps) {
            return foundComps.peekFront();
        } else {
            return null;
        }
    }

    getNamedComponent(cnum, name) {
        let ent = this.namedEnts.get(name);
        if (ent) {
            return ent.get(cnum);
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

class System {
    constructor(world) {
        this.world = world;
    }

    start() {
    }

    update() {
    }
}

class SystemManager {
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

class Position {
    constructor(x=0, y=0, z=0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Rotation {
    constructor() {
    }
}

class Cell {
    static unit = 1;

    static fromPosition(pos, val) {
        return Cell(~~(pos.x / Cell.unit), ~~(pos.y / Cell.unit), val)
    }
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
    }

    toPosition() {
        return new Position(this.x * Cell.unit, this.y * Cell.unit, 0);
    }
}

class ValueMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.extent = width * height;
        this.values = new Array(width * height);
    }

    fill(value) {
        for (let i = 0; i != this.extent; ++i) {
            this.values[i] = value;
        }
    }

    set(x, y, value) {
        let offset = y * this.width + x;
        this.values[offset] = value;
    }

    get(x, y) {
        let offset = y * this.width + x;
        return this.values[offset];
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }
}

class C_Identity extends Component {
    constructor() {
        super();
        this.species = "";
        this.name = "";
    }
}

class C_Transform extends Component {
    constructor() {
        super();
        this.pos = new Position();
        this.rot = new Rotation();
    }
}

class C_Landscape extends Component {
    constructor() {
        super();

        let env = Environment.get();
        let tileMap = new ValueMap(env.getScreenWidth(), env.getScreenHeight());
        tileMap.fill(1);
        //tileMap.set(1, 1, 0);
        //tileMap.set(2, 2, 0);
        this.tileMap = tileMap;
    }

    setTile(x, y, value) {
        this.tileMap.set(x, y, value);
    }

    isWall(x, y) {
        if (x >= 0 && y >= 0 && x < this.tileMap.width && y < this.tileMap.height) {
            return this.tileMap.get(x, y) ? true : false;
        } else {
            return true;
        }
    }
}

class C_Stage extends Component {
    constructor() {
        super();

        let env = Environment.get();
        let eidMap = new ValueMap(env.getScreenWidth(), env.getScreenHeight());
        eidMap.fill(0);
        this.eidMap = eidMap;
    }

    set(x, y, eid) {
        this.eidMap.set(x, y, eid);
    }

    get(x, y) {
        return this.eidMap.get(x, y);
    }

}

class C_TextScreen extends Component {
    constructor() {
        super();

        let env = Environment.get();
        let chMap = new ValueMap(env.getScreenWidth(), env.getScreenHeight());
        chMap.fill(' ');
        this.chMap = chMap;
    }

    set(x, y, ch) {
        this.chMap.set(x, y, ch);
    }

    get(x, y) {
        return this.chMap.get(x, y);
    }

    getWidth() {
        return this.chMap.getWidth();
    }

    getHeight() {
        return this.chMap.getHeight();
    }

}

const N_Identity = 1;
const N_Transform = 2;
const N_TextScreen = 3;
const N_Landscape = 4;
const N_Stage = 5;

class S_RotRandomMapGenrator extends System {
    start() {
        this._makeLandscapeDungeon();
    }

    _makeLandscapeDungeon() {
        let eid = this.world.spawn([N_Landscape, N_Stage, N_TextScreen]);
        let ent = this.world.get(eid);
        let landscape = ent.get(N_Landscape);
        let movableCells = [];
        let digger = new rot.Map.Digger();
        var digCallback = function(x, y, value) {
            landscape.setTile(x, y, value);
            if (value == 0) {
                movableCells.push(new Cell(x, y, value));
            }
        }
        digger.create(digCallback.bind(this));

        let stage = ent.get(N_Stage);
        let regenCells = rot.RNG.shuffle(movableCells);
        this._makeCharacter(stage, regenCells.pop(), '@');
    }

    _makeCharacter(stage, cell, species) {
        let eid = this.world.spawn([N_Identity, N_Transform]);
        let ent = this.world.get(eid);
        let iden = ent.get(N_Identity);
        iden.species = species;

        let trans = ent.get(N_Transform);
        trans.pos = cell.toPosition();

        stage.set(cell.x, cell.y, eid);
        return eid;
    }
}

class S_TextView extends System {
    static fullMask = parseInt("111" + "111" + "111", 2);
    static patternChars = new Map([
        [parseInt("111" + "111" + "111", 2), ' '], // 9
        [parseInt("111" + "111" + "110", 2), '┌'], // 8
        [parseInt("110" + "111" + "111", 2), '└'], // 8
        [parseInt("111" + "111" + "011", 2), '┐'], // 8
        [parseInt("011" + "111" + "111", 2), '┘'], // 8
        [parseInt("010" + "011" + "010", 2), '├'], // 4
        [parseInt("010" + "110" + "010", 2), '┤'], // 4
        [parseInt("000" + "111" + "010", 2), '┬'], // 4
        [parseInt("010" + "111" + "000", 2), '┴'], // 4
        [parseInt("010" + "111" + "010", 2), '┼'], // 4
        [parseInt("000" + "111" + "000", 2), '─'], // 3
        [parseInt("010" + "010" + "010", 2), '│'], // 3
    ]);
    static wallMaskChars = [
        //[parseInt("111" + "111" + "111", 2), ' '], // 9
        //[parseInt("111" + "111" + "110", 2), '┌'], // 8
        //[parseInt("110" + "111" + "111", 2), '└'], // 8
        //[parseInt("111" + "111" + "011", 2), '┐'], // 8
        //[parseInt("011" + "111" + "111", 2), '┘'], // 8
        [parseInt("110" + "110" + "110", 2), '│'], // 6
        [parseInt("011" + "011" + "011", 2), '│'], // 6
        [parseInt("000" + "111" + "111", 2), '─'], // 6
        [parseInt("111" + "111" + "000", 2), '─'], // 6
        [parseInt("010" + "111" + "010", 2), '┼'], // 4
        [parseInt("000" + "111" + "010", 2), '┬'], // 4
        [parseInt("010" + "111" + "000", 2), '┴'], // 4
        [parseInt("010" + "011" + "010", 2), '├'], // 4
        [parseInt("010" + "110" + "010", 2), '┤'], // 4
        [parseInt("010" + "010" + "010", 2), '│'], // 3
        [parseInt("000" + "111" + "000", 2), '─'], // 3
        [parseInt("000" + "011" + "010", 2), '┌'], // 3
        [parseInt("010" + "011" + "000", 2), '└'], // 3
        [parseInt("000" + "110" + "010", 2), '┐'], // 3
        [parseInt("010" + "110" + "000", 2), '┘'], // 3
        [parseInt("000" + "110" + "000", 2), '─'], // 2
        [parseInt("010" + "010" + "000", 2), '│'], // 2
        [parseInt("000" + "010" + "010", 2), '│'], // 2
        [parseInt("000" + "011" + "000", 2), '─'], // 2
        [parseInt("000" + "010" + "000", 2), '1'],
    ];
    static spaceMaskChars = [
        [parseInt("000" + "010" + "000", 2), '·'],
    ];

    start() {
        let screen = this.world.getFirstComponent(N_TextScreen);
        let height = screen.getHeight();
        let width = screen.getWidth();

        let landscape = this.world.getFirstComponent(N_Landscape);
        for (let y = 0; y != height; ++y) {
            for (let x = 0; x != width; ++x) {
                let ch = this.getLandscapeChar(landscape, x, y)
                screen.set(x, y, ch);
            }
        }

        let idens = this.world.getComponents(N_Identity);
        for (let iden of idens) {
            let ent = this.world.get(iden.eid);
            let trans = ent.get(N_Transform);
            let ch = this.getIdentityChar(iden)
            screen.set(trans.pos.x, trans.pos.y, ch);
        }
    }

    getLandscapeChar(landscape, x, y) {
        let pattern = 0
        if (landscape.isWall(x - 1, y - 1)) {pattern |= 1<<8;}
        if (landscape.isWall(x    , y - 1)) {pattern |= 1<<7;}
        if (landscape.isWall(x + 1, y - 1)) {pattern |= 1<<6;}
        if (landscape.isWall(x - 1, y    )) {pattern |= 1<<5;}
        if (landscape.isWall(x    , y    )) {pattern |= 1<<4;}
        if (landscape.isWall(x + 1, y    )) {pattern |= 1<<3;}
        if (landscape.isWall(x - 1, y + 1)) {pattern |= 1<<2;}
        if (landscape.isWall(x    , y + 1)) {pattern |= 1<<1;}
        if (landscape.isWall(x + 1, y + 1)) {pattern |= 1<<0;}

        let patternChar = S_TextView.patternChars.get(pattern);
        if (patternChar) {
            return patternChar;
        }

        for (let [mask, ch] of S_TextView.wallMaskChars) {
            let val = pattern & mask;
            if (val == mask) {
                return ch;
            }
        }

        let revPattern = S_TextView.fullMask - pattern;
        for (let [mask, ch] of S_TextView.spaceMaskChars) {
            let val = revPattern & mask;
            if (val == mask) {
                return ch;
            }
        }

        return '?';
    }

    getIdentityChar(iden) {
        return iden.species;
    }
}

class S_ConsoleView extends System {
    start() {
        let screen = this.world.getFirstComponent(N_TextScreen);
        let height = screen.getHeight();
        let width = screen.getWidth();
        let chars = new Array(width);
        for (let y = 0; y != height; ++y) {
            for (let x = 0; x != width; ++x) {
                chars[x] = screen.get(x, y);
            }
            let line = chars.join('');
            console.log(line);
        }
    }
}

class S_RotView extends System {
    constructor(world, display) {
        super(world);
        this.display = display;
    }

    start() {
        this._render();
    }

    _render() {
        let screen = this.world.getFirstComponent(N_TextScreen);
        let height = screen.getHeight();
        let width = screen.getWidth();

        for (let y = 0; y != height; ++y) {
            for (let x = 0; x != width; ++x) {
                let ch = screen.get(x, y);
                this.display.draw(x, y, ch);
            }
        }
    }
}

class RotApplication {
    run() {
        let env = Environment.get();
        let width = env.getScreenWidth();
        let height = env.getScreenHeight();
        let display = new rot.Display({
            width: width,
            height: height,
            layout: "term"
        });

        let factory = new Factory();
        factory.registerType(N_Identity, C_Identity);
        factory.registerType(N_Transform, C_Transform);
        factory.registerType(N_TextScreen, C_TextScreen);
        factory.registerType(N_Landscape, C_Landscape);
        factory.registerType(N_Stage, C_Stage);

        let world = new World(factory, 100);
        /*
        let eid = world.spawn([N_Identity, N_Transform]);
        let ent = world.get(eid);
        let iden = ent.get(N_Identity);
        iden.species = '@';
        let trans = ent.get(N_Transform);
        trans.pos = (5, 5);
        */
        let sysMgr = new SystemManager();
        let rotMapGenerator = new S_RotRandomMapGenrator(world);
        let textView = new S_TextView(world);
        let consoleView = new S_ConsoleView(world);
        let rotView = new S_RotView(world, display);
        sysMgr.add(rotMapGenerator);
        sysMgr.add(textView);
        if (env.screenMode == 'TTY') {
            sysMgr.add(rotView);
            sysMgr.start();
            //var scheduler = new rot.Scheduler.Simple();
            //scheduler.add(this.player, true);
            //this.engine = new rot.Engine(scheduler);
            //this.engine.start();
        } else {
            sysMgr.add(consoleView);
            sysMgr.start();
        }
    }
}

app = new RotApplication()
app.run()