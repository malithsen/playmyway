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
    console.log("loging in");
    console.log($scope.user);

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
      console.log(user);
      $state.go('admin');
    })
    .error(function(){
      $state.go('login');
    });
  };
}]);

qApp.controller('RootCtrl', ['$scope', '$rootScope', '$http', '$interval', 'cfpLoadingBar', function($scope, $rootScope, $http, $interval, cfpLoadingBar) {

  console.log("Root ctrl");
  var duration;
  var progress;
  var timer;
  var timerId;

  cfpLoadingBar.start();
  cfpLoadingBar.set(0); // Hide progress bar at the beginning

  $scope.socket = io();
  $scope.recentlyVoted = [];

  $scope.socket.on('refreshList', function(msg){
    $scope.loadSongs();
  });

  $scope.socket.on('songChanged', function(song){
    duration = song.meta.duration;

    $scope.loadSongs();
    console.log("Song changes", song);
    $rootScope.currSong = song;
    $scope.startTimer(duration);

    var ind = $scope.recentlyVoted.indexOf(song._name);

    if(ind > -1){
      $scope.recentlyVoted = $scope.recentlyVoted.splice(ind, 1);
    }

  });

  $scope.startTimer = function(duration) {
    console.log("duration", duration);
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

  $scope.voteup = function(id) {
    $http.get('upvote/' + id).success(function(data) {
      console.log(data);
      $scope.socket.emit('voteup','');
    });
  };

  $scope.pushVoted = function(song){
    if($scope.recentlyVoted.indexOf(song.name) < 0){

      $http.get('upvote/' + song._id).success(function(data) {
        console.log(data);
        $scope.recentlyVoted.push(song.name);
        $scope.socket.emit('voteup', data);
      });

    }
  }

  $scope.loadSongs();

}]);

qApp.controller('AdminCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

  console.log("Admin ctrl");

  $scope.socket = io();
  $scope.volume = 100;

  $rootScope.player = {
    playing: false,
    paused: false
  };

  $scope.getPlayerState = function() {
    $http.get('/api/playing').success(function(data) {
      $rootScope.player.playing = data['playerState'];
      console.log($rootScope.player.playing);
    });
  };

  $scope.getPausedState = function() {
    $http.get('/api/paused').success(function(data) {
      $rootScope.player.paused = data['pausedState'];
      console.log($rootScope.player.paused);
    });
  };

  $scope.getPlayerState();
  $scope.getPausedState();

  $scope.play = function(){
    if ($rootScope.player.paused === true) {
      $http.get('/pause').success(function(data) {
        console.log("Unpaused");
        $rootScope.player.playing = true;
        $rootScope.player.paused = false;
      });
    } else {
      $http.get('/play').success(function(data) {
        console.log("Playing");
        $rootScope.player.playing = true;
      });
    }
  };

  $scope.pause = function(){
    $http.get('/pause').success(function(data) {
      console.log("Paused");
      $rootScope.player.playing = false;
      $rootScope.player.paused = true;
      window.clearInterval($rootScope.timerId);
    });
  };

  $scope.next = function(){
    $http.get('/next').success(function(data) {
      console.log("Next song");
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

}]);

