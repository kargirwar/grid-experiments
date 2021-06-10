import { Grid, ClientSideRowModelModule } from "/node_modules/ag-grid-community/dist/ag-grid-community.esm.min.js"
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

        let $bt = document.getElementById('row-template')
        let bt = $bt.innerHTML

        //grid setup
        this.gridOptions = {
            columnDefs: [
                {headerName: 'id', field: 'id'},
                {headerName: 'serial', field: 'serial'},
                {headerName: 'zippin-serial', field: 'zippin-serial'},
                {headerName: 'file-path', field: 'file-path'},
                {headerName: 'url', field: 'url'},
                {headerName: 'promo-code-id', field: 'promo-code-id'},
                {headerName: 'store-id', field: 'store-id'},
                {headerName: 'patient-id', field: 'patient-id'},
                {headerName: 'delivery-address', field: 'delivery-address'},
                {headerName: 'documents-id', field: 'documents-id'},
                {headerName: 'patient-name', field: 'patient-name'},
                {headerName: 'doctor-id', field: 'doctor-id'},
                {headerName: 'additional-discount', field: 'additional-discount'},
                {headerName: 'promo-discount', field: 'promo-discount'},
                {headerName: 'total', field: 'total'},
                {headerName: 'advance', field: 'advance'},
                {headerName: 'net-payable', field: 'net-payable'},
                {headerName: 'payment-collected', field: 'payment-collected'},
                {headerName: 'change-value', field: 'change-value'},
                {headerName: 'payment-method', field: 'payment-method'},
                {headerName: 'transaction-status', field: 'transaction-status'},
                {headerName: 'cheque-number', field: 'cheque-number'},
                {headerName: 'dunzo-order-id', field: 'dunzo-order-id'},
                {headerName: 'zomato-order-id', field: 'zomato-order-id'},
                {headerName: 'amazon-pay-order-id', field: 'amazon-pay-order-id'},
                {headerName: 'redeemed-points', field: 'redeemed-points'},
                {headerName: 'generic-loyalty-ratio', field: 'generic-loyalty-ratio'},
                {headerName: 'ethical-loyalty-ratio', field: 'ethical-loyalty-ratio'},
                {headerName: 'created-by', field: 'created-by'},
                {headerName: 'created-at', field: 'created-at'},
                {headerName: 'updated-at', field: 'updated-at'},
                {headerName: 'payment-updated-by', field: 'payment-updated-by'},
            ]
        }

        let eGridDiv = document.querySelector('#grid');
        new Grid(eGridDiv, this.gridOptions);

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
        let json = {};
        for (let i = 0; i < row.length; i += 2) {
            json[row[i]] = row[i + 1];
        }

        $b.insertAdjacentHTML('beforeend', Utils.processTemplate(bt, json));
    }
}

new Index()
