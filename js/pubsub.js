import { Log } from './logger.js'
import { Constants } from './constants.js'

let subscribers = {};

class PubSub {
    static subscribe(evt, cb) {
        if (!subscribers[evt]) {
            subscribers[evt] = new Set();
        }
        subscribers[evt].add(cb);
    }

    static publish(evt, data) {
        let list = subscribers[evt];
        for (let s of list) {
            s(data);
        }
    }
}

export { PubSub }
