var qApp = angular.module('qApp', ['ui.router', 'cfp.loadingBar']);

qApp.config(['$stateProvider', '$urlRouterProvider', "$locationProvider", "$httpProvider", "cfpLoadingBarProvider", function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, cfpLoadingBarProvider) {

  cfpLoadingBarProvider.autoIncrement = false;
  cfpLoadingBarProvider.includeSpinner = false;

  var checkLoggedin = function($q, $timeout, $http, $location, $rootScope, $state){
    // Initialize a new promise
    var deferred = $q.defer();
    // Make an AJAX call to check if the user is logged in
    $http.get('/loggedin').success(function(user){
      // Authenticated
      if (user !== '0')
        deferred.resolve();
      // Not Authenticated
      else {
        deferred.reject();
        $state.go('login');
      }
    });
    return deferred.promise;
  };

  $httpProvider.interceptors.push(function($q, $location) {
    return {
      response: function(response) {
        // do something on success
        return response;
      },
      responseError: function(response) {
        if (response.status === 401)
          $location.url('/login');
        return $q.reject(response);
      }
    };
  });

  $urlRouterProvider.otherwise("/");
  $locationProvider.html5Mode(true);

  $stateProvider
    .state('/', {
      url: "/",
      templateUrl: "views/main",
      controller: 'RootCtrl'
    })
    .state('admin', {
      templateUrl: "views/admin",
      controller: 'AdminCtrl',
      resolve: {
        loggedin: checkLoggedin
      }
    })
    .state('login', {
      templateUrl: "views/login",
      controller: 'LoginCtrl'
    })

}])
.run(function($rootScope, $http){

  // Logout function is available in any pages
  $rootScope.logout = function(){
    $http.post('/logout');
  };
});

qApp.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$state', '$httpParamSerializerJQLike', function($scope, $rootScope, $http, $state, $httpParamSerializerJQLike) {
  // This object will be filled by the form
  $scope.user = {};

  // Register the login() function
  $scope.login = function(){

    $http({
      url: '/login',
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: $httpParamSerializerJQLike($scope.user)
    })
    .success(function(user){
      // No error: authentication OK
      $state.go('admin');
    })
    .error(function(){
      $state.go('login');
    });
  };
}]);

qApp.controller('RootCtrl', ['$scope', '$rootScope', '$http', '$interval', 'cfpLoadingBar', function($scope, $rootScope, $http, $interval, cfpLoadingBar) {

  var duration;
  var progress;
  var timer;
  var timerId;
  $rootScope.currSong = '';

  cfpLoadingBar.start();
  cfpLoadingBar.set(0); // Hide progress bar at the beginning

  $scope.socket = io();
  
  $scope.socket.on('refreshList', function(msg){
    $scope.loadSongs();
  });

  if(localStorage.getItem("recentlyVoted") === null){
    localStorage.setItem("recentlyVoted", "[]");
  }

  $scope.socket.on('songChanged', function(song){
    duration = song.meta.duration;

    $scope.loadSongs();
    $rootScope.currSong = song;
    $scope.startTimer(duration);

    var recentlyVoted = JSON.parse(localStorage.getItem("recentlyVoted"));   
    
    var ind = recentlyVoted.indexOf(song._name);

    if(ind > -1){
      recentlyVoted.splice(ind, 1);
      localStorage.setItem("recentlyVoted", JSON.stringify(recentlyVoted));
    }

  });

  $scope.startTimer = function(duration) {
    // stops any running interval to avoid two intervals running at the same time
    $scope.stopTimer();
    timer = 0

    // store the interval promise
    timerId = $interval(function(){
      if (!$rootScope.player.paused){
        timer++;
        progress = timer/duration;
        cfpLoadingBar.set(progress);
      };
    }, 1000);
  };

  $scope.stopTimer = function() {
    $interval.cancel(timerId);
  };

  $scope.loadSongs = function() {
    $http.get('songs/').success(function(data) {
      $rootScope.songs = data;
    });
  };

  $scope.getCurrent = function() {
    $http.get('/api/current/').success(function(data) {
      $rootScope.currSong = data.current;
    });
  };

  $scope.voteup = function(id) {
    $http.get('upvote/' + id).success(function(data) {
      $scope.socket.emit('voteup','');
    });
  };

  $scope.pushVoted = function(song){
    
    var recentlyVoted = JSON.parse(localStorage.getItem("recentlyVoted"));

    if(recentlyVoted.indexOf(song.name) < 0){
      
      $http.get('upvote/' + song._id).success(function(data) {
        recentlyVoted.push(song.name);
        $scope.socket.emit('voteup', data);
        localStorage.setItem("recentlyVoted", JSON.stringify(recentlyVoted));
      });

    }
  }

  $scope.loadSongs();
  $scope.getCurrent();

}]);

qApp.controller('AdminCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

  $scope.socket = io();
  $scope.volume = 100;

  $rootScope.player = {
    playing: false,
    paused: false
  };

  $scope.getPlayerState = function() {
    $http.get('/api/playing').success(function(data) {
      $rootScope.player.playing = data['playerState'];
    });
  };

  $scope.getPausedState = function() {
    $http.get('/api/paused').success(function(data) {
      $rootScope.player.paused = data['pausedState'];
    });
  };

  $scope.getPlayerState();
  $scope.getPausedState();

  $scope.play = function(){
    if ($rootScope.player.paused === true) {
      $http.get('/pause').success(function(data) {
        $rootScope.player.playing = true;
        $rootScope.player.paused = false;
      });
    } else {
      $http.get('/play').success(function(data) {
        $rootScope.player.playing = true;
      });
    }
  };

  $scope.pause = function(){
    $http.get('/pause').success(function(data) {
      $rootScope.player.playing = false;
      $rootScope.player.paused = true;
      window.clearInterval($rootScope.timerId);
    });
  };

  $scope.next = function(){
    $http.get('/next').success(function(data) {
      $rootScope.player.playing = true;
      $rootScope.player.paused = false;
    });
  };

  $scope.changeVol = function(){
    $scope.socket.emit('changeVol', $scope.volume / 100);
  };

  $scope.previous = function(){
    console.log("Play previous");
  };

  $scope.updateSongsList = function() {
    $http.get('reload/').success(function() {
    });
  };

  $scope.updateSongsList();

}]);

