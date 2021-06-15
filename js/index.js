import { Utils } from "./utils.js"
import { Stream } from "./stream.js"
import { DbUtils } from "./dbutils.js"
import { Constants } from "./constants.js"
import { Log } from "./logger.js"
const TAG = "index";

const MIN_ROWS = 100;
const ROWS = 500;
const COLS = 50;
const WIDTH = 100;
const HEIGHT = 25;

class Index {
	constructor() {
        const canvas = document.getElementById('canvas');
        canvas.width = COLS * WIDTH;
        canvas.height = ROWS * HEIGHT;

        this.ctx = canvas.getContext('2d');
        this.ctx.textBaseline = 'top'; 
        this.ctx.lineWidth = 0.5;
        this.render();
    }

    async render() {
        let creds = {
            'db': 'test-generico',
            'host': '127.0.0.1',
            'port': '3306',
            'user': 'server',
            'pass': 'dev-server',
        };

        let sessionId = await DbUtils.login(creds);

        let params = {
            'session-id': sessionId,
            query: `select * from \`bills-1\` limit ${ROWS}`
        };

        let s = new Date();

        let stream = new Stream(Constants.WS_URL + '/execute_ws?' + new URLSearchParams(params));

        let y = 0.5;

        while (true) {
            let row = await stream.get();

            if (row.length == 1 && row[0] == "eos") {
                break;
            }

            let x = 0.5;
            for (let i = 1; i < row.length; i += 2) {
                this.ctx.strokeRect(x, y, WIDTH, HEIGHT);
                this.ctx.strokeText(row[i], x, y)
                x += WIDTH;
            }

            y += HEIGHT;
        }

        let e = new Date();
        Log('index', e.getTime() - s.getTime());
    }
}
new Index()
