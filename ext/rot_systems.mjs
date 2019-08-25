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
        this.msgs = [];

        this.world.bindEvent(NE_Action, this);
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

        this._renderMessages();
    }

    _renderMessages() {
        for (let y = 0; y != this.msgs.length; ++y) {
            let msg = this.msgs[this.msgs.length - 1 - y];
            this.display.drawText(30, 10 + y, msg);
        }
    }

    recvEvent(evData) {
        if (evData instanceof(E_ActionInvoked)) {
            let text = evData.getActionText();
            this.msgs.push(text);
        }
    }
}
