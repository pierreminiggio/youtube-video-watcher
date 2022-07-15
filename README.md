# youtube-video-watcher
Clarification : Most of the views you'll get won't stick on your channel more than a few days.
Youtube is actually really good at recognizing fake views.

Automatically watches a Youtube video over and over again.

Traffic sent to the videos will be sent from free proxies from around the world, but you can also use Tor instead.

Requirements :
- Node JS and "node" in Environnement Variable PATH
- Tor and "tor" in Environnement Variable PATH (if you decide to use it with the Tor option)

Clone the project and move to its folder :
```
git clone https://github.com/pierreminiggio/youtube-video-watcher
cd ./youtube-video-watcher
```

Install dependencies :
```
npm install
```
^ This might fails and will ask you to install some other stuff to make puppeteer work, refer to https://github.com/puppeteer/puppeteer/blob/main/README.md and Google to install what's missing

Use this program like this:
```
node watch.js [[video:<code>[---search:"<terms>"] [<show>]] <tor>]
```

Examples :

Send traffic directly to a video (not recommended, will likely be flagged as fake view by Youtube)
fhCJMMxtKWk : is an example video code, you'll find your in the URL of your video.
```
node watch.js video:fhCJMMxtKWk
```
If you want to see what's going on :
```
node watch.js video:fhCJMMxtKWk show
```
If you want to use tor :
```
node watch.js video:fhCJMMxtKWk '' tor
node watch.js video:fhCJMMxtKWk show tor
```

Send traffic to a video through a Youtube search :
fhCJMMxtKWk : is an example video code, you'll find your in the URL of your video.
quelle formation de développeur web : is an example Youtube search, use one that makes your video show up in the first few results
```
node watch.js video:fhCJMMxtKWk---search:"quelle formation de développeur web"
```
If you want to see what's going on :
```
node watch.js video:fhCJMMxtKWk---search:"quelle formation de développeur web" show
```
If you want to use tor :
```
node watch.js video:fhCJMMxtKWk---search:"quelle formation de développeur web" '' tor
node watch.js video:fhCJMMxtKWk---search:"quelle formation de développeur web" show tor
```

You need to know :
- You can only launch as many non-Tor view bots as your machine supports.
- You can only launch 1 Tor view bot per machine, it will also remove your ability to use Tor for any other use while it's running
