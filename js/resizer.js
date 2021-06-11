import { Log } from './logger.js'

const TAG = "resizer"
class Resizer {
    constructor($h) {
        this.$h = $h;
        this.currX = -1;

        const styles = window.getComputedStyle(this.$h);
        this.currWidth = parseInt(styles.width, 10);

        Log(TAG, `cw: ${this.currWidth}`);

        this.resizer = this.$h.querySelector('.resizer');
        this.resizer.addEventListener('mousedown', (e) => {
            this.currX = e.clientX;
            Log(TAG, `mousedown: ${this.currX}`);
        });

        this.$h.addEventListener('mousemove', (e) => {
            //Log(TAG, `mousemovmove: ${e.clientX} ${this.currX}`);
        });

        document.addEventListener('mouseup', (e) => {
            if (this.currX == -1) {
                return;
            }
            Log(TAG, `mouseup: ${e.clientX} ${this.currX}`);
            let dx = e.clientX - this.currX;
            Log(TAG, `mouseup: ${dx}`);
            this.$h.style.width = `${this.currWidth + dx}px`;
            this.currWidth += dx;
            this.currX = -1;
        });
    }
}
export { Resizer }
