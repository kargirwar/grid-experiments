import { Constants } from "./constants.js"
import { Log } from "./logger.js"
import { Utils } from "./utils.js"
import { DbUtils } from "./dbutils.js"
import { Stream } from "./stream.js"

const TAG = 'index';
const BATCH_SIZE = 50;

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
            query: `select * from \`inventory-1\` limit 250`
        };

        let s = new Date();

        let stream = new Stream(Constants.WS_URL + '/execute_ws?' + new URLSearchParams(params));
        let $tbody = document.querySelector('tbody');

        let rt = '';

        let i = 0;
        let j = 0;
        let t = '';
        var re = new RegExp(/{(.*?)}/g);

        while (true) {
            let row = await stream.get();

            if (row.length == 1 && row[0] == "eos") {
                break;
            }

            if (i == 0) {
                //create template for this table
                this.showHeaders(row);
                rt = Utils.createTemplate(row);
                i++;
            }

            //this.appendRow(re, $body, rt, row, fkMap);

            let json = {}
            for (let i = 0; i < row.length; i += 2) {
                let c = row[i] //this is column name
                let v = row[i + 1]
                let refTable = ''
                let refColumn = ''

                //get reftable and refColumn if any. Only for Non NULL values
                if (fkMap[c] && v != "NULL") {
                    refTable = fkMap[c]['ref-table']
                    refColumn = fkMap[c]['ref-column']
                }

                json[row[i]] = row[i + 1]; 
                json[`ref-table-${i}`] = refTable;
                json[`ref-column-${i}`] = refColumn;

                if (refTable) {
                    json[`display-${i}`] = `icon-show`;
                } else {
                    json[`display-${i}`] = `icon-hide`;
                }

                if (v == "NULL") {
                    json[`null-${i}`] = 'null';
                } else {
                    json[`null-${i}`] = '';
                }
            }

            t += rt.replace(re, (match, p1) => {
                if (json[p1] || json[p1] == 0 || json[p1] == '') {
                    return json[p1];
                } else {
                    return match;
                }
            });

            j++;

            if (j == BATCH_SIZE) {
                $tbody.insertAdjacentHTML('beforeend', t);
                j = 0;
                t = '';
            }
        }

        $tbody.insertAdjacentHTML('beforeend', t);

        let e = new Date();
        Log(TAG, e.getTime() - s.getTime());
    }

    showHeaders(row) {
        let $thead = document.querySelector('thead');
        let t = '<tr>';
        for (let i = 0; i < row.length; i += 2) {

            t += `<th>${row[i]}</th>`;
        }

        t += '</tr>'
        $thead.insertAdjacentHTML('beforeend', t);
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

    appendRow(re, $b, rt, row, fkMap) {
        //convert to form suitable for processTemplate
        let json = {}
        for (let i = 0; i < row.length; i += 2) {
            let c = row[i] //this is column name
            let v = row[i + 1]
            let refTable = ''
            let refColumn = ''

            //get reftable and refColumn if any. Only for Non NULL values
            if (fkMap[c] && v != "NULL") {
                refTable = fkMap[c]['ref-table']
                refColumn = fkMap[c]['ref-column']
            }

            json[row[i]] = row[i + 1]; 
            json[`ref-table-${i}`] = refTable;
            json[`ref-column-${i}`] = refColumn;

            if (refTable) {
                json[`display-${i}`] = `icon-show`;
            } else {
                json[`display-${i}`] = `icon-hide`;
            }

            if (v == "NULL") {
                json[`null-${i}`] = 'null';
            } else {
                json[`null-${i}`] = '';
            }
        }

        rt = rt.replace(re, function(match, p1) {
            if (json[p1] || json[p1] == 0 || json[p1] == '') {
                return json[p1];
            } else {
                return match;
            }
        });

        $b.insertAdjacentHTML('beforeend', rt);

        //$b.insertAdjacentHTML('beforeend', Utils.processTemplate(rt, json))
    }
}

new Index()
