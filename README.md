PlayMyWay is a web player aimed at providing a fully flexible and dynamic
playlist ordering based on user voting. It would allow the users to become
part of a more exciting and active Dance Floor experience rather than being
the classic, passive audience stepping to the beat of a single DJ. PlayMyWay
allows you to become the DJ and the Dancer at the same time! Just connect
to the app via Web or LAN and start voting the songs on the Playlist.

Installation
============

1. Clone the repo using `git clone` 
2. Navigate into the project folder using `cd playmyway`
3. Run an `npm install` to get the dependencies
4. Run `mongod` to start mongodb service
5. Issue `npm start` to run the app (default port is localhost:8080)

Note: Debian/Ubuntu users would need to install ALSA headers if not already installed: `sudo apt-get install libasound2-dev`

Configuration
=============
1. Change the path to point the songs directory 
2. Set credentials for admin user 