import { Log } from './logger.js'

const TAG = 'cell-template';
const cellTemplate = (createElement, props, fkMap) => {
    Log(TAG, props.rowIndex);
    let p = props.model[props.prop]
    let nullClass = '';

    let c = props.prop;//column name
    let v = props.model[props.prop];//column value

    let refTable = ''
    let refColumn = ''

    if (fkMap[c] && v != "NULL") {
        refTable = fkMap[c]['ref-table']
        refColumn = fkMap[c]['ref-column']
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

    return createElement('div', {class: nullClass}, v);
};

export { cellTemplate }
