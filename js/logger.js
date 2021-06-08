const TAGS = [
    'login',
    'utils',
]

const ENABLED = new Set(TAGS)

export function Log(tag, str) {
    //if (!ENABLED.has(tag)) {
        //return
    //}

    let [month, date, year]    = new Date().toLocaleDateString("en-US").split("/")
    let [hour, minute, second] = new Date().toLocaleTimeString("en-US").split(/:| /)

    console.log(`${date}-${month}-${year} ${hour}:${minute}:${second}:::${tag}: ${str}`)
}
