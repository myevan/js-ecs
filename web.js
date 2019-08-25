import { World, SystemManager } from './base/ecs.mjs';

import { C_Factory } from './core/components.mjs'
import { S_TextScreenRenderer } from './core/systems.mjs'

import { S_RotLandscapeManager, S_RotDisplayRenderer } from './ext/rot_systems.mjs'

import { S_Master, S_Player } from './rpg/rpg_systems.mjs'
import { E_Factory } from './rpg/rpg_events.mjs'

class WebApplication {
    constructor() {
        this.evtFactory = new E_Factory();
        this.world = null;
        this.sysMgr = null;
        this.engine = null;
    }

    run() {
        let display = new ROT.Display();
        document.body.appendChild(display.getContainer());

        let world = new World(C_Factory.get(), 100);
        let sysMgr = new SystemManager();
        let landscapeMgr = new S_RotLandscapeManager(ROT, world);
        let screenRdr = new S_TextScreenRenderer(world);
        let master = new S_Master(world);
        let player = new S_Player(world);
        // DEBUG: landscapeMgr.makeDungeon(1234);
        landscapeMgr.makeDungeon();
        sysMgr.add(landscapeMgr);
        sysMgr.add(master);
        sysMgr.add(player);
        sysMgr.add(screenRdr);

        let displayRdr = new S_RotDisplayRenderer(ROT, world, display);
        sysMgr.add(displayRdr);
        sysMgr.start();

        var scheduler = new ROT.Scheduler.Simple();
        let engine = new ROT.Engine(scheduler);
        scheduler.add(this, true);

        this.world = world;
        this.sysMgr = sysMgr;
        this.engine = engine;
        this.engine.start();
    }

    act() {
        this.engine.lock();
        window.addEventListener("keydown", this);
    }

    handleEvent(e) {
        let keyEvent = this.evtFactory.createKeyPressedFromCharacter(e.key, e);
        this.world.sendEvent(keyEvent)
        this.sysMgr.update();

        window.removeEventListener("keydown", this);
        this.engine.unlock();
    }
}

window.onload = function() {
    let app = new WebApplication();
    app.run();
}
