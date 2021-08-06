import { Log } from './logger.js'
import { Utils } from './utils.js'
import { Constants } from './constants.js'
import { PubSub } from './pubsub.js'
import { Stream } from './stream.js'

const TAG = "dbutils"
class DbUtils {

    static async fetch(sessionId, query) {
        PubSub.publish(Constants.QUERY_DISPATCHED, {query: query, tags: [Constants.SYSTEM]});
        query = encodeURIComponent(query);

        let params = {
            'session-id': sessionId,
            query: query
        }

        let json = await Utils.fetch(Constants.URL + '/query?' + new URLSearchParams(params))
        let cursorId = json.data['cursor-id']

        params = {
            'session-id': sessionId,
            'cursor-id': cursorId,
            'num-of-rows': Constants.BATCH_SIZE
        }

        json = await Utils.fetch(Constants.URL + '/fetch?' + new URLSearchParams(params))
        return json.data
    }

    static async fetchAll(sessionId, query) {
        PubSub.publish(Constants.QUERY_DISPATCHED, {query: query, tags: [Constants.SYSTEM]});

        let params = {
            'session-id': sessionId,
            query: query
        }

        let json = await Utils.fetch(Constants.URL + '/query?' + new URLSearchParams(params))
        if (json.status == 'error') {
            Log(TAG, JSON.stringify(json))
            return []
        }

        let cursorId = json.data['cursor-id']

        params = {
            'session-id': sessionId,
            'cursor-id': cursorId,
            'num-of-rows': Constants.BATCH_SIZE
        }

        let eof = false
        let rows = []

        do {
            json = await Utils.fetch(Constants.URL + '/fetch?' + new URLSearchParams(params))
            if (json.status == "error") {
                Log(TAG, JSON.stringify(json))
                return []
            }

            Log(TAG, JSON.stringify(json))
            if (!json.data) {
                //if batch size == num of rows in query result, then we might get json.data = null
                //but we should still return results fetched till this point
                return rows
            }
            rows = rows.concat(json.data)
            eof = json.eof
        } while (!eof)

        return rows
    }

    static async login(creds) {
        let json = await Utils.fetch(Constants.URL + '/login?' + new URLSearchParams(creds))
        if (json.status == 'error') {
            Log(TAG, JSON.stringify(json))
            return ""
        }

        return json.data['session-id']
    }

    static async execute(sessionId, query) {
        let params = {
            'session-id': sessionId,
            query: query
        }

        let json = await Utils.fetch(Constants.URL + '/execute?' + new URLSearchParams(params))
        return json.data
    }

    static async cancel(sessionId, cursorId) {
        let params = {
            'session-id': sessionId,
            'cursor-id': cursorId,
        }

        let json = await Utils.fetch(Constants.URL + '/cancel?' + new URLSearchParams(params), false)
        Log(TAG, JSON.stringify(json))
        return json.data
    }

    static async fetchCursorId(sessionId, query) {
        query = encodeURIComponent(query);
        let params = {
            'session-id': sessionId,
            query: query
        }

        let json = await Utils.fetch(Constants.URL + '/query?' + new URLSearchParams(params), false)
        return json.data['cursor-id']
    }

    async exportResults(q) {
        let cursorId = await DbUtils.fetchCursorId(this.sessionId, q)
        Log(TAG, `cursorId: ${cursorId}`);
        let params = {
            'session-id': this.sessionId,
            'cursor-id': cursorId,
            'req-id': Utils.uuid(),
            'num-of-rows': -1,
            'export': true
        }

        PubSub.publish(Constants.QUERY_DISPATCHED, {
            query: q,
            tags: [Constants.USER]
        });

        let stream = new Stream(Constants.WS_URL + '/fetch_ws?' + new URLSearchParams(params))
        let i = 1;

        let csv = '';
        let fileName = '';
        let n = 0;

        while (true) {
            let row
            try {
                row = await stream.get();
            } catch (e) {
                PubSub.publish(Constants.STREAM_ERROR, {
                    'error': e
                });
                break;
            }

            if (row.length == 1 && row[0] == "eos") {
                break;
            }

            if (row[0] == "header") {
                fileName = row[2];

                PubSub.publish(Constants.START_PROGRESS, {
                    title: `Exporting to ${fileName}`
                });
                continue;
            }

            if (row[0] == "current-row") {
                n += row[1];

                PubSub.publish(Constants.UPDATE_PROGRESS, {
                    message: `Processed ${row[1]} rows`
                });
            }
        }

        if (n > 0) {
            PubSub.publish(Constants.UPDATE_PROGRESS, {
                message: `Export complete`
            });
        } else {
            PubSub.publish(Constants.START_PROGRESS, {
                title: `No data`
            });

            PubSub.publish(Constants.UPDATE_PROGRESS, {
                message: `Processed 0 rows`
            });
        }

        PubSub.publish(Constants.STOP_PROGRESS, {});
    }
}

export { DbUtils }
