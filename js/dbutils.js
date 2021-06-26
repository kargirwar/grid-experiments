import { Log } from './logger.js'
import { Utils } from './utils.js'
import { Constants } from './constants.js'

const TAG = "dbutils"
class DbUtils {

    static async fetch(sessionId, query) {
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
}
export { DbUtils }
