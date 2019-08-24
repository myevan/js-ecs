import { World, SystemManager } from './base/ecs.mjs';

import { C_Factory } from './core/components.mjs'
import { S_TextScreenRenderer } from './core/systems.mjs'

import { S_RotDungeonGenerator, S_RotDisplayRenderer } from './ext/rot_systems.mjs'

import { S_Player } from './rpg/rpg_systems.mjs'
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
        let dungeonGenerator = new S_RotDungeonGenerator(ROT, world);
        let screenRenderer = new S_TextScreenRenderer(world);
        let player = new S_Player(world);
        sysMgr.add(dungeonGenerator);
        sysMgr.add(screenRenderer);
        sysMgr.add(player);

        let displayRenderer = new S_RotDisplayRenderer(ROT, world, display);
        sysMgr.add(displayRenderer);
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
