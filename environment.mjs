export class Environment {
    static inst = null;

    static get() {
        if (!Environment.inst) {
            Environment.inst = new Environment();
        }
        return Environment.inst;
    }

    constructor() {
        if (typeof process === 'object') {
            let stdout = process.stdout;
            if (stdout._type === 'tty') {
                this.screenMode = 'TTY';
                this.screenWidth = stdout.columns;
                this.screenHeight = stdout.rows;
                return;
            }
        }

        this.screenMode = ''
        this.screenWidth = 80;
        this.screenHeight = 25;
    }

    getScreenWidth() {
        return this.screenWidth;
    }

    getScreenHeight() {
        return this.screenHeight;
    }
}
