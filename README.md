PlayMyWay provides a way to create playlists based on votes. Currently it is work in progress and far from usable.

## Development

`npm install`

change PATH variable in server.js to point to your songs directory

for Debian/Ubuntu users install ALSA headers if not already installed:
sudo apt-get install libasound2-dev

#### What needs to be done

##### immediately

###### Frontend
* ~~Add styles~~
* ~~Add a button to vote up (Currently clicking on 'vote up' text works)~~
* Highlight the song currently being played
* Design another view for the admin. This should give the ability to control the player (play, pause, stop etc)
* Limit access to admin view (password maybe?)

###### Backend
* ~~Sort songs by votes. If multiple songs have the same votes, song last voted should be the last~~
* Change songs directory, better if we can add multiple directories and individual songs.
* ~~Automatically move to the next song in the playlist once the current one is over.~~

##### Not so immediately
Well let's save that for later :P
