//import { defineCustomElements } from 'https://unpkg.com/@revolist/revogrid@latest/loader/index.es2017.js';
import { Log } from "./logger.js"
import { Resizer } from "./resizer.js"

const TAG = 'index';

class Index {
    constructor() {
        this.isDragging = false;
        this.$grid = document.getElementById('grid');
        this.$col1 = document.getElementById('col-1');
        this.$col2 = document.getElementById('col-2');
        this.w1 = this.$col1.getBoundingClientRect().width;
        this.w2 = this.$col2.getBoundingClientRect().width;
        
        Log(TAG, `${this.w1} ${this.w2}`);

        let $resizer = document.getElementById('resizer');
        $resizer.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startx = e.clientX;
            Log(TAG, `mousedown: ${e.clientX}`);
        })

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) {
                return;
            }
            Log(TAG, `mousemove: ${e.clientX}`);
            let delta = e.clientX - this.startx;
            this.w1 += delta;
            this.w2 += -1 * delta;
            Log(TAG, `${delta} ${this.w1} ${this.w2}`);

            this.$grid.style.gridTemplateColumns = `${this.w1}px 2px ${this.w2}px`;
            this.startx = e.clientX;
        });

        document.addEventListener('mouseup', (e) => {
            this.isDragging = false;
            Log(TAG, `mouseup: ${e.clientX}`);
        })
    }
}

new Index()
