import { World, SystemManager } from './base/ecs.mjs';
import { Environment } from './base/environment.mjs'

import { C_Factory } from './core/components.mjs'
import { S_TextScreenRenderer, S_ConsoleRenderer } from './core/systems.mjs'

import { S_RotLandscapeManager, S_RotDisplayRenderer } from './ext/rot_systems.mjs'

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
        if (env.screenMode == 'TTY') {
            this._hideCusor();
            this._setKeyRawMode();

            process.on("exit", () => {
                this._moveCursor(process.stdout.rows + 1);
                this._showCursor();
            });

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
        } else {
            let consoleRdr = new S_ConsoleRenderer(world);
            sysMgr.add(consoleRdr);
            let displayRdr = new S_RotDisplayRenderer(ROT, world, display);
            sysMgr.add(displayRdr);
            sysMgr.start();

            var scheduler = new ROT.Scheduler.Simple();
            let engine = new ROT.Engine(scheduler);
            scheduler.add(this, false);

            this.world = world;
            this.sysMgr = sysMgr;
            this.engine = engine;
            engine.start();
            /*
            console.log("!!");
            player.move(1, 0);
            sysMgr.update();
            */
        }
    }

    act() {
        let _this = this;
        let onKey = (ch, info) => {
            let keyEvent = _this.eFactory.createKeyPressedFromCharacter(ch, info);
            _this.world.sendEvent(keyEvent)
            _this.sysMgr.update();

            process.stdin.removeListener("keypress", onKey);
            _this.engine.unlock();
        };

        let env = Environment.get();
        if (env.screenMode == 'TTY') {
            this.engine.lock();
            process.stdin.on("keypress", onKey);
        } else {
            this.engine.lock();
            _this.sysMgr.update();
            this.engine.unlock();
        }
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
