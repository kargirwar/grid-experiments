import { Constants } from "./constants.js"
import { Log } from "./logger.js"
import { Utils } from "./utils.js"
import { DbUtils } from "./dbutils.js"
import { Stream } from "./stream.js"

const TAG = 'index';

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
        let constraints = await DbUtils.fetch(sessionId, encodeURIComponent(`SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE
                TABLE_SCHEMA = 'test-generico' and
                TABLE_NAME = 'inventory-1'`));

        let fkMap = this.createFKMap(constraints);

        let params = {
            'session-id': sessionId,
            query: `select * from \`inventory-1\` limit 100`
        };

        let s = new Date();

        let stream = new Stream(Constants.WS_URL + '/execute_ws?' + new URLSearchParams(params));
        let $body = document.querySelector('tbody');

        //let $bt = document.getElementById('row-template')
        //let bt = $bt.innerHTML
        let rt = '';

        let i = 0;
        var re = new RegExp(/{(.*?)}/g);

        while (true) {
            let row = await stream.get();

            if (row.length == 1 && row[0] == "eos") {
                break;
            }

            if (i == 0) {
                //create template for this table
                rt = Utils.createTemplate(row);
                i++;
            }

            this.appendRow($body, rt, row, fkMap);
        }

        let e = new Date();
        Log(TAG, e.getTime() - s.getTime());
    }

    createFKMap(constraints) {
        let fkMap = {}
        let colIndex, refTblIndex, refColIndex

        //first get indexes of columns of interest
        let i = 0
        constraints[0].forEach((c) => {
            switch (c) {
                case 'COLUMN_NAME':
                    colIndex = (i + 1)
                    break

                case 'REFERENCED_TABLE_NAME':
                    refTblIndex = (i + 1)
                    break;

                case 'REFERENCED_COLUMN_NAME':
                    refColIndex = (i + 1)
                    break;
            }
            i++
        })

        //Now get values of columns for each row
        constraints.forEach((row) => {
            if (row[refTblIndex] != "NULL") {
                fkMap[row[colIndex]] = {
                    'ref-table': row[refTblIndex],
                    'ref-column': row[refColIndex],
                }
            }
        })

        return fkMap
    }


    appendRow($b, rt, row, fkMap) {
        //convert to form suitable for processTemplate
        let json = {}
        for (let i = 0; i < row.length; i += 2) {
            json[row[i]] = row[i + 1]; 
        }
        $b.insertAdjacentHTML('beforeend', Utils.processTemplate(rt, json))
    }
}

new Index()
