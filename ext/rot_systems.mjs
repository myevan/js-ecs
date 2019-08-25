import { System } from '../base/ecs.mjs';
import { Cell } from '../base/primitives.mjs'

import { E_ActionInvoked } from '../core/events.mjs';

import { NC_TextScreen, NC_Landscape, NC_Stage } from '../core/numbers.mjs'
import { NE_Action } from '../core/numbers.mjs';

export class S_RotLandscapeManager extends System {
    constructor(rot, world) {
        super(world);
        this.rot = rot;
        this.movCells = [];
    }

    makeDungeon(inSeed=-1) {
        if (inSeed >= 0) {
            this.rot.RNG.setSeed(inSeed);
        }

        let curSeed = this.rot.RNG.getSeed();

        let eid = this.world.spawn([NC_Landscape, NC_Stage, NC_TextScreen]);
        let ent = this.world.get(eid);
        let landscape = ent.get(NC_Landscape);
        landscape.setSeed(curSeed);

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
        this.screen = null;
    }

    start() {
        this.screen = this.world.getFirstComponent(NC_TextScreen);
        this._render();
    }

    update() {
        this._render();
    }

    _render() {
        let height = this.screen.getHeight();
        let width = this.screen.getWidth();

        for (let y = 0; y != height; ++y) {
            for (let x = 0; x != width; ++x) {
                let ch = this.screen.get(x, y);
                this.display.draw(x, y, ch);
            }
        }

        this._renderLogs();
    }

    _renderLogs() {
        for (let y = 0; y != this.world.logs.length; ++y) {
            let text = this.world.logs[y];
            this.display.drawText(0, 0 + y, text);
        }
    }
}
