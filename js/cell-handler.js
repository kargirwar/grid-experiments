import { Log } from './logger.js'
import { PubSub } from './pubsub.js'

const TAG = 'cell-handler';
class CellHandler {
    constructor(grid, fkMap) {
        this.edited = new Set();
        this.grid = grid;
        this.fkMap = fkMap;

        document.addEventListener('paste', (e) => {
            Log(TAG, 'paste');
            let paste = (event.clipboardData || window.clipboardData).getData('text');
            let target = e.target;
            target.value = paste;
            e.preventDefault();
        });

        this.grid.addEventListener('afteredit', async (e) => {
            Log(TAG, e['detail']['val']);
            Log(TAG, e['detail']['rowIndex']);
            Log(TAG, e['detail']['prop']);
            this.edited.add(e['detail']['rowIndex']);
            this.grid.clearFocus();

            //find out the primary key for this row
            let data = await this.grid.getSource();
            let k = this.fkMap['primary-key'];
            PubSub.publish('cell-edited', {
                key: {
                    'name': k,
                    'value': data[e['detail']['rowIndex']][k],
                },
                col: {
                    'name': e['detail']['prop'],
                    'value': e['detail']['val']
                }
            });
        });
    }

    cellTemplate(createElement, props) {
        Log(TAG, props.rowIndex);
        let p = props.model[props.prop]
        let nullClass = '';

        let c = props.prop;//column name
        let v = props.model[props.prop];//column value

        let refTable = ''
        let refColumn = ''

        if (this.fkMap[c] && v != "NULL") {
            refTable = this.fkMap[c]['ref-table']
            refColumn = this.fkMap[c]['ref-column']
        }

        if (v == "NULL") {
            nullClass = 'null'
        }

        if (refTable) {
            return createElement('div', {},
                createElement('span', {}, v),
                createElement('i', {
                    'class': 'icon-new-tab',
                    'data-table': refTable,
                    'data-column': refColumn,
                }));
        }

        if (this.edited.has(props.rowIndex)) {
            return createElement('div', {class: 'edited'}, v);
        }
        return createElement('div', {class: nullClass}, v);
    }
}

export { CellHandler }
