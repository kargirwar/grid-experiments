import { Log } from './logger.js'
import { Utils } from './utils.js'
import { Constants } from './constants.js'
import { PubSub } from './pubsub.js'

const TAG = "progress-bar"
class ProgressBar {
    constructor(options = {}) {
        this.progressBar = document.getElementById('progress-bar-no-buttons');
        this.message = this.progressBar.querySelector('.message');
        this.time = this.progressBar.querySelector('.time');
        this.hasButtons = false;

        PubSub.subscribe(Constants.START_PROGRESS, (data) => {
            this.time.innerHTML = '';
            this.message.innerHTML = '';
            this.elapsed = 0;

            if (this.hasButtons) {
                this.title.innerHTML = data.title
            }

            this.timer = setInterval(() => {
                this.elapsed++;
                this.time.innerHTML = this.elapsed + ' s';
            }, 1000);

            this.progressBar.classList.add('is-active');
        });

        PubSub.subscribe(Constants.STOP_PROGRESS, () => {
            clearInterval(this.timer);

            //if we have buttons, wait till user clicks ok
            if (this.ok) {
                this.ok.disabled = false;
                this.cancel.disabled = true;
                return
            }

            //otherwise close ourselves immediately
            this.progressBar.classList.remove('is-active');
        });

        PubSub.subscribe(Constants.UPDATE_PROGRESS, (data) => {
            this.message.innerHTML = data.message;
        });
    }

    setOptions(options) {
        if (options.buttons) {
            this.progressBar = document.getElementById('progress-bar-with-buttons');
            this.title = this.progressBar.querySelector('.modal-card-title');
            this.ok = this.progressBar.querySelector('.ok');
            this.cancel = this.progressBar.querySelector('.cancel');
            this.cancelFunc = options.cancel;

            this.ok.disabled = true;
            this.cancel.disabled = false;

            this.ok.addEventListener('click', () => {
                this.progressBar.classList.remove('is-active');
            });

            this.cancel.addEventListener('click', () => {
                this.cancelFunc()
                this.progressBar.classList.remove('is-active');
            });

            this.hasButtons = true;

        } else {
            this.ok = null
            this.cancel = null
            this.cancelFunc = null
            this.progressBar = document.getElementById('progress-bar-no-buttons');
            this.hasButtons = false;
        }

        this.message = this.progressBar.querySelector('.message');
        this.time = this.progressBar.querySelector('.time');
    }
}

let progressBar = new ProgressBar()
export default progressBar
