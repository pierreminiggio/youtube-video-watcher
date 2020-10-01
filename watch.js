const {exec} = require('child_process')
const puppeteer = require('puppeteer')

/**
 * @param {int} ms 
 */
const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * @param {int} videoDuration 
 * @param {int} adsDuration 
 * @param {string} color 
 */
const displayTimer = async (videoDuration, adsDuration, color) => {

    console.log(color, 'Let\'s say the ads duration are ' + adsDuration + ' seconds...')

    for (let time = 0; time <= adsDuration; time++) {
        await timeout(1000)
        if ((time % 5 === 0) || time === adsDuration) {
            console.log(color, 'Ads : Watched ' + time + 's / ' + adsDuration + 's')
        }
    }
    
    for (let time = 0; time <= videoDuration; time++) {
        await timeout(1000)
        if ((time % 5 === 0) || time === videoDuration) {
            console.log(color, 'Video : Watched ' + time + 's / ' + videoDuration + 's')
        }
    }
}

/**
 * @param {string} code 
 * @param {boolean} tor 
 * @param {string} color 
 * @param {boolean} show 
 */
const startWatchingYoutubeVideo = async (code, tor, color, show, adsDuration) => {

    let launchParameters = {headless: ! show}
    if (tor) {
        launchParameters.args = ['--proxy-server=socks5://127.0.0.1:9050']
    }
    const browser = await puppeteer.launch(launchParameters)

    if (tor) {
        const testPage = await browser.newPage()
        await testPage.goto('https://check.torproject.org/')
        const isUsingTor = await testPage.$eval('body', el =>
            el.innerHTML.includes('Congratulations. This browser is configured to use Tor')
        )
        
        if (isUsingTor) {
            console.log(color, 'Puppeteer using tor, all good.')
        } else {
            console.log(color, 'Not using Tor. Closing...')
            return await browser.close()
        }
        
        testPage.close()
    }
    

    try {
        const page = await browser.newPage()

        page.goto('https://www.youtube.com/watch?v=' + code, {waitUntil: 'networkidle2', timeout: 0})

        await page.waitFor(10000)

        const videoDuration = await page.evaluate(() => (typeof ytplayer !== 'undefined') ? (ytplayer.config ? ytplayer.config.args.length_seconds : null) : null)
        if (videoDuration === null) {
            throw 'Video duration could not be determined, likely because it encountered a Captcha.'
        }
        console.log(color, 'Video duration: ' + videoDuration + ' seconds')

        const videoDurationToWatch = Math.floor(Math.random() * videoDuration) + 1
        console.log(color, 'Let\'s only watch ' + videoDurationToWatch + ' seconds !')

        page.click('.ytp-play-button')

        const duration = videoDurationToWatch + adsDuration

        displayTimer(videoDurationToWatch, adsDuration, color)
        
        await page.waitFor(duration * 100)

    } catch(e) {
        console.error(e)
    }

    browser.close()
}

/**
 * @param {string} code 
 * @param {boolean} show 
 * @param {string} color 
 * @param {int} adsDuration 
 */
function watchVideo(code, show, color, adsDuration) {

    try {
        console.log(color, '\n\nClear previous tor...\n\n\n\n')

        exec('taskkill /IM "tor.exe" /F', (error, stdout, stderr) => {
            if (! error && stdout && ! stderr) {
                console.log(color, 'Tor stopped')
            } else {
                console.log(color, 'Tor couldn\'t be stopped, probably already stopped')
            }

            console.log(color, 'Starting tor...')

            exec('tor&', (error, stdout, stderr) => {

                if (! error && stdout && ! stderr) {
                    console.log(color, 'Tor started')
                } else {
                    console.error(color, 'Error while starting tor, please make sure tor is started')
                }

            })

            setTimeout(() => {
                console.log(color, "Let's watch " + code)

                startWatchingYoutubeVideo(code, true, color, show, adsDuration).then(() => {
                    watchVideo(code, show, color, adsDuration)
                }).catch(e => {
                    console.warn(color, '\n\nEncoutered an error, starting again...')
                    watchVideo(code, show, color, adsDuration)
                })

            }, 2000)

        })
    } catch(e) {
        console.warn(color, '\n\nEncoutered an error, starting again...')
        watchVideo(code, show, color, adsDuration)
    }
}

const letsGo = () => {

    if (process.argv.length < 3) {

        console.warn('Use this program like this: "node watch.js <video:code> <option: show>"')

    } else {

        let video = process.argv[2].includes('video:') ? process.argv[2].replace('video:', '') : null
        const show = process.argv.length > 3 && process.argv[3] === 'show'

        if (video) {
            watchVideo(video, show, '\x1b[35m', 0)
        }  
    }
}

letsGo()
