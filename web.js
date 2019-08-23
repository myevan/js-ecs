import { World, Entity, Component, System, SystemManager } from './ecs.mjs';
import { ComponentFactory } from './components.mjs'
import { S_RotRandomMapGenrator, S_TextView, S_Player, S_RotView } from './systems.mjs'

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
}
