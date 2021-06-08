import { Constants } from "./constants.js"
import { Log } from "./logger.js"
import { Utils } from "./utils.js"
import { DbUtils } from "./dbutils.js"
import { Stream } from "./stream.js"

class Index {
    constructor() {
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
            query: `select * from \`bills-1\` limit 1000`
        };

        let s = new Date();

        let stream = new Stream(Constants.WS_URL + '/execute_ws?' + new URLSearchParams(params));
        let $body = document.querySelector('body');

        let $bt = document.getElementById('div-template')
        let bt = $bt.innerHTML

		while (true) {
            let row = await stream.get();

            if (row.length == 1 && row[0] == "eos") {
                break;
            }

            this.appendRow($body, bt, row);
        }

        let e = new Date();
        Log('index', e.getTime() - s.getTime());
    }

    appendRow($b, bt, row) {
        for (let j = 1; j < row.length; j += 2) {
            let v = row[j]

            $b.insertAdjacentHTML('beforeend', Utils.processTemplate(bt, {
                value: v,
            }))
        }	
    }
}

new Index()
