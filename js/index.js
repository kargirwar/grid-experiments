//import { defineCustomElements } from 'https://unpkg.com/@revolist/revogrid@latest/loader/index.es2017.js';
import { defineCustomElements } from '/node_modules/@revolist/revogrid/dist/esm/loader.js'
import { cellTemplate } from './cell-template.js'
import { CellHandler } from './cell-handler.js'
import { Constants } from "./constants.js"
import { Log } from "./logger.js"
import { Utils } from "./utils.js"
import { DbUtils } from "./dbutils.js"
import { Stream } from "./stream.js"
import { Resizer } from "./resizer.js"
import { PubSub } from './pubsub.js'

const TAG = 'index';
const BATCH_SIZE = 50;
const TABLE = 'bills-1';

class Index {
    constructor() {
        defineCustomElements();
        this.render();

        PubSub.subscribe('cell-edited', async (data) => {
            Log(TAG, JSON.stringify(data));
            let res = await DbUtils.execute(this.sessionId, 
                encodeURIComponent(`update \`${TABLE}\`
                    set \`${data.col.name}\` = '${data.col.value}' 
                    where \`${data.key.name}\` = '${data.key.value}'`));
        });

        document.addEventListener('DOMContentLoaded', () => {
            let e = document.getElementById('full-screen');
            e.addEventListener('click', () => {
                this.toggleFullScreen();
            });
        });
    }

    toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    async render() {
        let creds = {
            'db': 'prod3-generico',
            'host': '127.0.0.1',
            'port': '3310',
            'user': 'server',
            'pass': 'dev-server',
        };

        this.sessionId = await DbUtils.login(creds);
        let constraints = await DbUtils.fetch(this.sessionId, encodeURIComponent(`SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE
                TABLE_SCHEMA = 'prod3-generico' and
                TABLE_NAME = '${TABLE}'`));
        Log(TAG, JSON.stringify(constraints));

        let fkMap = this.createFKMap(constraints);
        Log(TAG, JSON.stringify(fkMap));

        let params = {
            'session-id': this.sessionId,
            query: `select * from \`${TABLE}\` limit 10`
        };

        Log(TAG, "Starting");
        let s = new Date();

        let stream = new Stream(Constants.WS_URL + '/query_ws?' + new URLSearchParams(params));
        const grid = document.querySelector('revo-grid');

        let i = 0;
        let columns = [];
        let items = [];
        let cellHandler = new CellHandler(grid, fkMap);

        while (true) {
            let row = await stream.get();

            if (row.length == 1 && row[0] == "eos") {
                break;
            }

            if (i == 0) {
                for (let j = 0; j < row.length; j += 2) {
                    columns.push({
                        'prop': row[j],
                        'name': row[j],
                        cellTemplate: (createElement, props) => {
                            return cellHandler.cellTemplate(createElement, props);
                        }
                    });
                }
                i++;
            }

            let item = {};
            for (let j = 0; j < row.length; j += 2) {
                item[row[j]] = row[j + 1];
            }

            items.push(item);
        }

        grid.resize = true;
        grid.columns = columns;
        grid.source = items;

        let e = new Date();
        Log(TAG, e.getTime() - s.getTime());
    }

    attachResizers() {
        let $headers = document.querySelectorAll('th');
        $headers.forEach(($h) => {
            new Resizer($h);
        })
    }

    showHeaders(row) {
        let $thead = document.querySelector('thead');
        let t = '<tr>';
        for (let i = 0; i < row.length; i += 2) {

            t += `<th>
                    <div class="th">
                        <div>${row[i]}</div>
                        <div class="resizer"></div>
                    </div>
                </th>`;
        }

        t += '</tr>'
        $thead.insertAdjacentHTML('beforeend', t);
    }

    createFKMap(constraints) {
        let fkMap = {}
        let colIndex, refTblIndex, refColIndex, constraintNameIndex

        //first get indexes of columns of interest
        let i = 0
        constraints[0].forEach((c) => {
            switch (c) {
                case 'CONSTRAINT_NAME':
                    constraintNameIndex = (i + 1)
                    break

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

            if (row[constraintNameIndex] == 'PRIMARY') {
                fkMap['primary-key'] = row[colIndex]
            }
        })

        return fkMap
    }
}

new Index()
