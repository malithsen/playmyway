 var qApp = angular.module('qApp', ['ui.router']);

qApp.config(['$stateProvider', '$urlRouterProvider', "$locationProvider", function($stateProvider, $urlRouterProvider, $locationProvider) {
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
      controller: 'AdminCtrl'
    })
}]);


qApp.controller('RootCtrl', ['$scope', '$rootScope', '$http', '$interval', function($scope, $rootScope, $http, $interval) {

  console.log("Root ctrl");

  $scope.loadSongs = function() {
    $http.get('songs/').success(function(data) {
      $rootScope.songs = data;
    });
  };

  $scope.voteup = function(id) {
    $http.get('upvote/' + id).success(function(data) {
      console.log(data);
      $scope.loadSongs();
    });
  };

  $scope.getCurrSong = function(){
    $http.get('/songs/current').success(function(data) {
      $rootScope.currSong = data;
    });
  };

  $scope.loadSongs();

  $interval($scope.getCurrSong, 1000);

}]);

qApp.controller('AdminCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

  console.log("Admin ctrl");

  $scope.player = {
    playing: false,
    paused: false
  };

  $scope.play = function(){
    if ($scope.player.paused === true) {
      $http.get('/pause').success(function(data) {
        console.log("Unpaused");
        $scope.player.playing = true;
        $scope.player.paused = false;
      });
    } else {
      $http.get('/play').success(function(data) {
        console.log("Playing");
        $scope.player.playing = true;
      });
    }
  };

  $scope.pause = function(){
    $http.get('/pause').success(function(data) {
      console.log("Paused");
      $scope.player.playing = false;
      $scope.player.paused = true;
    });
  };

  $scope.next = function(){
    $http.get('/next').success(function(data) {
      console.log("Next song");
      $scope.player.playing = true;
      $scope.player.paused = false;
    });
  };

  $scope.previous = function(){
    console.log("Play previous");
  };

}]);

