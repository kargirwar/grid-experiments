import { Log } from './logger.js'
import { Err } from './error.js'

const TAG = "utils"
class Utils {
    constructor() {
        //new Utils() must be called after DOMContentLoaded
        this.init()
    }

    init() {
        this.$alert = document.getElementById('alert')
    }

    static saveToSession(key, val) {
        sessionStorage.setItem(key, val)
    }

    static getFromSession(key, val) {
        return sessionStorage.getItem(key)
	}

    static createTemplate(row) {
        let t = '<tr>';

        for (let i = 0; i < row.length; i += 2) {
            t += `<td class="{null-${i}}">
                    <div class="td">
                        <span>{${row[i]}}</span>
                        <i class="fk-ref icon-new-tab {display-${i}}" data-table="{ref-table-${i}}" data-column="{ref-column-${i}}"></i>
                    </div>
                </td>`;
        }

        t += '</tr>';
        return t;
    }

	static processTemplate(templ, data) {
		var re = new RegExp(/{(.*?)}/g);

		templ = templ.replace(re, function(match, p1) {
			if (data[p1] || data[p1] == 0 || data[p1] == '') {
				return data[p1];
			} else {
				return match;
			}
		});

		return templ;
	}

	//https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
	static generateNode(templ, data) {
		let re = new RegExp(/{(.*?)}/g);

		templ = templ.replace(re, function(match, p1) {
			if (data[p1] || data[p1] == 0 || data[p1] == '') {
				return data[p1];
			} else {
				return match;
			}
		});

		let template = document.createElement('template');
		template.innerHTML = templ.trim()
		return template.content
	}

	static async fetch(url) {
		try {
			let response = await fetch(url, {
				headers: {
					'X-Request-ID': this.uuid()
				}
			})

			let json = await response.json()

			if (json.status == 'error') {
				throw json
			}

			return json
		} catch (e) {
			Log(TAG, e)

			if (e['msg'] == Err.ERR_INVALID_SESSION_ID) {
				//user must login
				window.location = '/login';
				return
			}

			if (e['msg'] == Err.ERR_INVALID_CURSOR_ID) {
				//let caller handle this
				return {
					'status' : 'error',
					'msg': e['msg'],
					'data': null,
				}
			}

			if (e.msg) {
				//normal error. Display to user
				alert(e.msg)
				return e
			}

			//something terrible happened
			Log(TAG, `${url}: Unrecoverable error`)
			alert("Unrecoverable error. Most likely prosql agent is dead or not installed:-(")
			return {
				'status' : 'error',
				'msg': e,
				'data': null,
			}
		}
	}

	static async setOptions($ctx, values, def) {
		$ctx.replaceChildren()

		let $ot = document.getElementById('option-template')
		let ot = $ot.innerHTML

		values.forEach((v) => {
			let h = Utils.generateNode(ot, {value: v[1]})
			$ctx.append(h)
		})

		$ctx.value = def
	}

	showAlert(msg, t) {
		this.$alert.innerHTML = msg;
		this.$alert.style.visibility = 'visible';
		setTimeout(() => {
			this.$alert.style.visibility = 'hidden';
		}, t)
	}

	static showNoData() {
		Log(TAG, "No data")
	}

	//https://gist.github.com/gordonbrander/2230317
	static uuid() {
		// Math.random should be unique because of its seeding algorithm.
		// Convert it to base 36 (numbers + letters), and grab the first 9 characters
		// after the decimal.
		return '_' + Math.random().toString(36).substr(2, 9);
	};
}
export { Utils }
