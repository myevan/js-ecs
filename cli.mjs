import { World, SystemManager } from './base/ecs.mjs';
import { Environment } from './base/environment.mjs'
import { ComponentFactory } from './core/components.mjs'
import { E_KeyPressed } from './core/events.mjs'
import { S_TextView, S_Player, S_ConsoleView } from './core/systems.mjs'
import { S_RotView, S_RotRandomMapGenrator } from './core/systems.mjs'

import { NK_Unknown, NK_Up, NK_Down, NK_Left, NK_Right } from './core/events.mjs';
import { NC_TextScreen } from './core/components.mjs'

import ROT from './core/ext/rot.js'
import keypress from './core/ext/keypress.js'

const CH_CTRL_C = "\u0003";
const CH_ESC = "\u001b";

class S_RotConsoleView extends S_RotView {
    static chKeyNums = {
        'k': NK_Up,
        'j': NK_Down,
        'h': NK_Left,
        'l': NK_Right,
    };

    start() {
        if (typeof process === 'object') {
            this._hideCusor();
            this._setKeyRawMode();

            process.on("exit", () => {
                this._moveCursor(process.stdout.rows + 1);
                this._showCursor();
            });
        }

        this._render();
    }

    update() {
        this._render();
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
    
    _moveCursor(row) {
        process.on("exit", function() {
            process.stdout.write("\x1b[" + row + ";1H");
        });
    }

    _hideCusor() {
        process.stdout.write("\x1b[?25l");
    }

    _showCursor() {
        process.stdout.write("\x1b[?25h");
    }
}

class RotSchedule {
    constructor(engine, world, sysMgr) {
        this.engine = engine;
        this.world = world;
        this.sysMgr = sysMgr;
    }
    act() {
    }
}

class RotAutoSchedule extends RotSchedule {
    act() {
        this.sysMgr.update();
    }
}

class RotKeyTurnSchedule extends RotSchedule {
    act() {
        this.engine.lock();

        let _this = this;
        let onKey = (ch, info) => {
            let kNum = S_RotConsoleView.chKeyNums[ch];
            if (kNum) {
                _this.world.sendEvent(new E_KeyPressed(kNum, info))
            } else {
                _this.world.sendEvent(new E_KeyPressed(NK_Unknown, info))
            }
            _this.sysMgr.update();

            process.stdin.removeListener("keypress", onKey);
            _this.engine.unlock();
        };

        process.stdin.on("keypress", onKey);
    }
}

class RotApplication {
    run() {
        let env = Environment.get();
        let width = env.getScreenWidth();
        let height = env.getScreenHeight();
        let display = new ROT.Display({
            width: width,
            height: height,
            layout: "term"
        });

        let factory = new ComponentFactory();
        let world = new World(factory, 100);
        let sysMgr = new SystemManager();
        let rotMapGenerator = new S_RotRandomMapGenrator(ROT, world);
        let textView = new S_TextView(world);
        let player = new S_Player(world);
        sysMgr.add(rotMapGenerator);
        sysMgr.add(textView);
        sysMgr.add(player);
        if (env.screenMode == 'TTY') {
            let consoleView = new S_RotConsoleView(ROT, world, display);
            sysMgr.add(consoleView);
            sysMgr.start();

            var scheduler = new ROT.Scheduler.Simple();
            let engine = new ROT.Engine(scheduler);
            scheduler.add(new RotKeyTurnSchedule(engine, world, sysMgr), true);
            engine.start();
        } else {
            let consoleView = new S_ConsoleView(world);
            sysMgr.add(consoleView);
            sysMgr.start();

            var scheduler = new ROT.Scheduler.Simple();
            let engine = new ROT.Engine(scheduler);
            scheduler.add(new RotAutoSchedule(engine, world, sysMgr), true);
            engine.start();
        }
    }
}

let app = new RotApplication()
app.run()
