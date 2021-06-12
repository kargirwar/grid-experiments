import { Utils } from "./utils.js"
import { Log } from "./logger.js"
const TAG = "index";
class Index {
	constructor() {
        let t = '<svg xmlns="http://www.w3.org/2000/svg">';
        let s = new Date();

        for (let i = 0; i < 2000; i += 20) {
            for (let j = 0; j < 2500; j += 50) {
                t += this.getNodeXmlWithText('rect', {
                    x: j,
                    y: i,
                    width: 50,
                    height: 20,
                    stroke:'black',
                    strokeWidth:0.025,
                    fill: '#fff'
                }, 'some text')
            }
        }

        t += '</svg>';
        let $body = document.querySelector('body');
        $body.insertAdjacentHTML('beforeend', t);

        let e = new Date();
        Log(TAG, e.getTime() - s.getTime());
    }

    getNode(n, v) {
        n = document.createElementNS("http://www.w3.org/2000/svg", n);
        for (var p in v)
            n.setAttributeNS(null, p.replace(/[A-Z]/g, function(m, p, o, s) { return "-" + m.toLowerCase(); }), v[p]);
        return n
    }

    getNodeXml(n, attrs) {
        let t = `<${n} `;
        for (let k in attrs) {
            t += `${k}="${attrs[k]}" `;
        }
        t += `></${n}>`;
        return t;
    }

    getNodeXmlWithText(n, attrs, s) {
        let r = `<${n} `;
        let t = `<foreignobject `;
        let set = new Set(['x', 'y', 'height', 'width']);
        for (let k in attrs) {
            r += `${k}="${attrs[k]}" `;
            if (set.has(k)) {
                t += `${k}="${attrs[k]}" `;
            }
        }
        r += `></${n}>`;

        t += '><body xmlns="http://www.w3.org/1999/xhtml">';
        t += `<div>${s}</div></body>'`;
        t += `></foreignobject>`;
        return r + t;
    }
}
new Index()
