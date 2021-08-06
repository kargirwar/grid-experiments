class Ace {
    static init() {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.min.js';
            script.onload = () => {
                resolve(ace)
            };
            document.head.appendChild(script);
        });
	}
}

export { Ace }
