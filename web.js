import { World, Entity, Component, System, SystemManager } from './ecs.mjs';
import { ComponentFactory } from './components.mjs'
import { E_KeyPressed } from './events.mjs'
import { S_RotRandomMapGenrator, S_TextView, S_Player, S_RotView } from './systems.mjs'
import { NK_Unknown, NK_Up, NK_Down, NK_Left, NK_Right } from './events.mjs';

class KeyEventFactory {
    static chKeyNums = {
        'k': NK_Up,
        'j': NK_Down,
        'h': NK_Left,
        'l': NK_Right,
    };

    createCharacterKeyEvent(ch, info) {
        let keyNum = KeyEventFactory.chKeyNums[ch];
        if (keyNum) {
            return new E_KeyPressed(keyNum, info);
        } else {
            return new E_KeyPressed(NK_Unknown, info);
        }
    }
}

class RotKeyTurnSchedule {
    constructor(engine, world, sysMgr) {
        this.engine = engine;
        this.world = world;
        this.sysMgr = sysMgr;
        this.keyEventFactory = new KeyEventFactory();
    }

    act() {
        this.engine.lock();
        window.addEventListener("keydown", this);
    }

    handleEvent(e) {
        let keyEvent = this.keyEventFactory.createCharacterKeyEvent(e.key, e);
        this.world.sendEvent(keyEvent);
        this.sysMgr.update();

        window.removeEventListener("keydown", this);
        this.engine.unlock();
    }
}

window.onload = function() { 
    let display = new ROT.Display();
    document.body.appendChild(display.getContainer());

    let factory = ComponentFactory.get();
    let world = new World(factory, 100);
    let sysMgr = new SystemManager();
    let rotMapGenerator = new S_RotRandomMapGenrator(ROT, world);
    let textView = new S_TextView(world);
    let player = new S_Player(world);
    sysMgr.add(rotMapGenerator);
    sysMgr.add(textView);
    sysMgr.add(player);

    let rotView = new S_RotView(ROT, world, display);
    sysMgr.add(rotView);
    sysMgr.start();

    var scheduler = new ROT.Scheduler.Simple();
    let engine = new ROT.Engine(scheduler);
    scheduler.add(new RotKeyTurnSchedule(engine, world, sysMgr), true);
    engine.start();
}
