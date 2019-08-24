import { World, SystemManager } from './base/ecs.mjs';
import { Environment } from './base/environment.mjs'

import { C_Factory } from './core/components.mjs'
import { E_KeyPressed } from './core/events.mjs'
import { S_TextScreenRenderer, S_ConsoleRenderer } from './core/systems.mjs'
import { NK_Unknown, NK_Up, NK_Down, NK_Left, NK_Right } from './core/numbers.mjs';

import { S_RotDungeonGenerator, S_RotDisplayRenderer } from './ext/rot_systems.mjs'

import { S_Master, S_Player } from './rpg/rpg_systems.mjs'
import { E_Factory } from './rpg/rpg_events.mjs'

import ROT from './ext/rot.js'
import keypress from './ext/keypress.js'

const CH_CTRL_C = "\u0003";
const CH_ESC = "\u001b";

class RotApplication {
    constructor() {
        this.eFactory = new E_Factory();
        this.world = null;
        this.sysMgr = null;
    }
    run() {
        let env = Environment.get();
        let width = env.getScreenWidth();
        let height = env.getScreenHeight();
        let display = new ROT.Display({
            width: width,
            height: height,
            layout: "term"
        });

        let world = new World(new C_Factory(), 100);
        let sysMgr = new SystemManager();
        let dungeonGenerator = new S_RotDungeonGenerator(ROT, world);
        let screenRenderer = new S_TextScreenRenderer(world);
        let master = new S_Master(world);
        let player = new S_Player(world);
        sysMgr.add(dungeonGenerator);
        sysMgr.add(master);
        sysMgr.add(player);
        sysMgr.add(screenRenderer);
        if (env.screenMode == 'TTY') {
            this._hideCusor();
            this._setKeyRawMode();

            process.on("exit", () => {
                this._moveCursor(process.stdout.rows + 1);
                this._showCursor();
            });

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
        } else {
            let consoleRenderer = new S_ConsoleRenderer(world);
            sysMgr.add(consoleRenderer);
            sysMgr.start();

            /*
            var scheduler = new ROT.Scheduler.Simple();
            let engine = new ROT.Engine(scheduler);
            scheduler.add(new RotAutoSchedule(engine, world, sysMgr), true);
            engine.start();
            */
        }
    }

    act() {
        this.engine.lock();

        let _this = this;
        let onKey = (ch, info) => {
            let keyEvent = _this.eFactory.createKeyPressedFromCharacter(ch, info);
            _this.world.sendEvent(keyEvent)
            _this.sysMgr.update();

            process.stdin.removeListener("keypress", onKey);
            _this.engine.unlock();
        };

        process.stdin.on("keypress", onKey);
    }

    _hideCusor() {
        process.stdout.write("\x1b[?25l");
    }

    _showCursor() {
        process.stdout.write("\x1b[?25h");
    }

    _moveCursor(row) {
        process.on("exit", function() {
            process.stdout.write("\x1b[" + row + ";1H");
        });
    }

    _setKeyRawMode() {
        keypress(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.resume();

        let _this = this;
        process.stdin.on("keypress", function(ch, info) {
            if (ch === CH_CTRL_C || ch === CH_ESC) {
                process.exit(0);
            }
        });
    }
    
}

let app = new RotApplication()
app.run()
