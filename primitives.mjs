export class Position {
    constructor(x=0, y=0, z=0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    plus(x=0, y=0, z=0) {
        return new Position(this.x + x, this.y + y, this.z + z);
    }
}

export class Rotation {
    constructor() {
    }
}

export class Cell {
    static unit = 1;

    static fromPosition(pos, val) {
        return new Cell(~~(pos.x / Cell.unit), ~~(pos.y / Cell.unit), val)
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

export class ValueMap {
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
