import { System } from '../base/ecs.mjs';
import { Cell } from '../base/primitives.mjs'

import { NC_Identity, NC_Transform, NC_TextScreen, NC_Landscape, NC_Stage } from '../core/numbers.mjs'

export class S_RotLandscapeManager extends System {
    constructor(rot, world) {
        super(world);
        this.rot = rot;
        this.movCells = [];
    }

    makeDungeon() {
        let eid = this.world.spawn([NC_Landscape, NC_Stage, NC_TextScreen]);
        let ent = this.world.get(eid);
        let landscape = ent.get(NC_Landscape);
        let digger = new this.rot.Map.Digger();
        var digCallback = function(x, y, value) {
            landscape.setTile(x, y, value);
            if (value == 0) {
                this.movCells.push(new Cell(x, y, value));
            }
        }
        digger.create(digCallback.bind(this));

        let stage = ent.get(NC_Stage);
        stage.setMovableCells(this.movCells);
        stage.setRegenCells(this.rot.RNG.shuffle(this.movCells));
    }

}

export class S_RotDisplayRenderer extends System {
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
