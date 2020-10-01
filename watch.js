const {exec} = require('child_process')
const puppeteer = require('puppeteer')

/**
 * @param {int} ms 
 */
const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}
/**
 * @param {int} videoDurationToWatch 
 * @param {int} adsDuration 
 * @param {string} color 
 */
const displayTimer = async (videoDurationToWatch, adsDuration, color) => {

    console.log(color, 'Let\'s say the ads duration are ' + adsDuration + ' seconds...')

    for (let time = 0; time <= adsDuration; time++) {
        await timeout(1000)
        if ((time % 5 === 0) || time === adsDuration) {
            console.log(color, 'Ads : Watched ' + time + 's / ' + adsDuration + 's')
        }
    }
    
    for (let time = 0; time <= videoDurationToWatch; time++) {
        await timeout(1000)
        if ((time % 5 === 0) || time === videoDurationToWatch) {
            console.log(color, 'Video : Watched ' + time + 's / ' + videoDurationToWatch + 's')
        }
    }
}

/**
 * @param {boolean} tor 
 * @param {boolean} show 
 * 
 * @returns {Promise<Browser>}
 */
async function createBrowser(tor, show) {
    return new Promise(async (resolve, rejects) => {
        let launchParameters = {headless: ! show}
        if (tor) {
            launchParameters.args = ['--proxy-server=socks5://127.0.0.1:9050']
        }
        puppeteer.launch(launchParameters).then(browser => {
            resolve(browser)
        }).catch(error => {
            rejects(error)
        })
    })
    
}

/**
 * @param {string} code 
 * @param {number} videoDuration
 * @param {?string} terms
 * @param {boolean} tor 
 * @param {string} color 
 * @param {boolean} show 
 */
const startWatchingYoutubeVideo = async (code, videoDuration, terms, tor, color, show, adsDuration) => {

    const browser = await createBrowser(tor, show)

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
        if (terms) {

            try {
                page.goto('https://www.youtube.com/results?search_query=' + terms, {waitUntil: 'networkidle2', timeout: 0})
            } catch(e) {
                throw 'Search page failed to load, likely a temporary network error'
            }

            const videoLinkSelector = 'a[href="/watch?v=' + code + '"]'
            await page.waitForSelector(videoLinkSelector);
            page.click(videoLinkSelector)
            await page.waitForSelector('.style-scope.ytd-channel-name')
            
        } else {
            await loadVideoPage(page, code)
        }

        if (! terms) {
            const videoDurationToCheck = await findVideoDurationForPage(page)
            if (videoDurationToCheck === null) {
                throw 'Video duration could not be determined, likely because it encountered a Captcha.'
            }
            console.log(videoDurationToCheck)
        }
        
        console.log(color, 'Video duration: ' + videoDuration + ' seconds')

        const videoDurationToWatch = Math.floor(Math.random() * Math.floor(videoDuration * 2/3)) + Math.floor(videoDuration * 1/3)
        console.log(color, 'Let\'s only watch ' + videoDurationToWatch + ' seconds !')

        if (! terms) {
            page.click('.ytp-play-button')
        }

        const duration = videoDurationToWatch + adsDuration

        displayTimer(videoDurationToWatch, adsDuration, color)

        await page.waitFor(duration * 1000)

    } catch(e) {
        console.error(e)
    }

    console.log(color, 'Done watching !')

    browser.close()
}

/**
 * @param {Page} page 
 * @param {string} code 
 * 
 * @returns {Promise}
 * 
 * @throws
 */
async function loadVideoPage(page, code) {
    return new Promise(async (resolve, rejects) => {
        page.goto('https://www.youtube.com/watch?v=' + code, {waitUntil: 'networkidle2', timeout: 0})
        try {
            await page.waitForSelector('.ytp-play-button', {
                timeout: 10000
            })
        } catch (e) {
            rejects('Play button was not loaded')
        }
        resolve()
    })
}

/**
 * @param {Page} page 
 * 
 * @returns {Promise<number>}
 */
async function findVideoDurationForPage(page) {
    return new Promise(async (resolve) => {
        resolve(
            await page.evaluate(
                () => (
                    typeof ytplayer !== 'undefined'
                ) ? (ytplayer.config ? ytplayer.config.args.length_seconds : null) : null
            )
        )
    })
}

/**
 * @param {string} code 
 * @param {boolean} tor 
 * @param {boolean} show 
 * @param {string} color
 * 
 * @returns {Promise<number>}
 */
async function tryFindDurationForVideo(code, tor, show, color) {
    return new Promise(async (resolve, rejects) => {
        console.log(color, 'Let\'s try to find the duration for the video ' + code)
        await restartTor(color)

        try {
            const browser = await createBrowser(tor, show)
            const videoPage = await browser.newPage()
            await loadVideoPage(videoPage, code)
            const duration = await findVideoDurationForPage(videoPage)
            browser.close()
            console.log(color, 'Got the duration : ' + duration + ' seconds')
            resolve(duration)
        } catch(e) {
            browser.close()
            rejects('Error while trying to find video duration')
        }
    })
}

/**
 * @param {string} code 
 * @param {boolean} tor 
 * @param {boolean} show 
 * @param {string} color 
 * 
 * @returns {Promise<number>}
 */
async function findDurationForVideo(code, tor, show, color) {
    return new Promise(async (resolve) => {
        try {
            const videoDuration = await tryFindDurationForVideo(code, tor, show, color)
            resolve(videoDuration)
        } catch(e) {
            resolve(findDurationForVideo(code, tor, show, color))
        }
        
    })
}

/**
 * @param {string} color 
 * 
 * @returns {Promise}
 */
async function restartTor(color) {
    return new Promise(resolve => {
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
                resolve()
            }, 5000)

        })
    })
}

/**
 * @param {string} code 
 * @param {number} videoDuration 
 * @param {?string} terms 
 * @param {boolean} show 
 * @param {string} color 
 * @param {int} adsDuration 
 */
function watchVideo(code, videoDuration, terms, show, color, adsDuration) {

    try {
        restartTor(color).then(() => {
            console.log(color, "Let's watch " + code)

            startWatchingYoutubeVideo(code, videoDuration, terms, true, color, show, adsDuration).then(() => {
                watchVideo(code, videoDuration, terms, show, color, adsDuration)
            }).catch(e => {
                console.warn(color, '\n\nEncoutered an error, starting again...')
                watchVideo(code, videoDuration, terms, show, color, adsDuration)
            })
        })
    } catch(e) {
        console.warn(color, '\n\nEncoutered an error, starting again...')
        watchVideo(code, videoDuration, terms, show, color, adsDuration)
    }
}

const letsGo = async () => {

    if (process.argv.length < 3) {

        console.warn('Use this program like this: "node watch.js [video:<code>[---search:"<terms>"] [<show>]]"')

    } else {

        const args2 = process.argv[2].split('---')
        let video = args2[0].includes('video:') ? args2[0].replace('video:', '') : null
        
        let terms = null
        if (args2.length === 2) {
            terms = args2[1].includes('search:') ? args2[1].replace('search:', '') : null
        }

        const show = process.argv.length > 3 && process.argv[3] === 'show'

        if (video) {
            const color = '\x1b[35m'
            const videoDuration = await findDurationForVideo(video, true, show, color)
            watchVideo(video, videoDuration, terms, show, color, 0)
        }  
    }
}

letsGo()
