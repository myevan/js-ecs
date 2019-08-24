import { System } from '../base/ecs.mjs';
import { Cell } from '../base/primitives.mjs'

import { NC_Identity, NC_Transform, NC_TextScreen, NC_Landscape, NC_Stage } from '../core/numbers.mjs'

export class S_RotRandomMapGenrator extends System {
    constructor(rot, world) {
        super(world);
        this.rot = rot;
    }

    start() {
        this._makeLandscapeDungeon();
    }

    _makeLandscapeDungeon() {
        let eid = this.world.spawn([NC_Landscape, NC_Stage, NC_TextScreen]);
        let ent = this.world.get(eid);
        let landscape = ent.get(NC_Landscape);
        let movableCells = [];
        let digger = new this.rot.Map.Digger();
        var digCallback = function(x, y, value) {
            landscape.setTile(x, y, value);
            if (value == 0) {
                movableCells.push(new Cell(x, y, value));
            }
        }
        digger.create(digCallback.bind(this));

        let stage = ent.get(NC_Stage);
        let regenCells = this.rot.RNG.shuffle(movableCells);
        this._makeCharacter(stage, regenCells.pop(), '@');
    }

    _makeCharacter(stage, cell, species) {
        let eid = this.world.spawn([NC_Identity, NC_Transform]);
        let ent = this.world.get(eid);
        let iden = ent.get(NC_Identity);
        iden.species = species;

        let trans = ent.get(NC_Transform);
        trans.pos = cell.toPosition();

        stage.set(cell.x, cell.y, eid);
        return eid;
    }
}

export class S_RotView extends System {
    constructor(rot, world, display) {
        super(world);
        this.rot = rot;
        this.display = display;
    }

    start() {
        this._render();
    }

    update() {
        this._render();
    }

    _render() {
        let screen = this.world.getFirstComponent(NC_TextScreen);
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
