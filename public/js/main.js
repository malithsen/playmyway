 var qApp = angular.module('qApp', ['ngRoute']);

qApp.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('!');

  $routeProvider
  .when('/', {
    templateUrl: 'views/main',
    controller: 'RootCtrl'
  })
  .otherwise({
    templateUrl: 'views/404',
    controller: 'MetaCtrl'
  });
}]);


qApp.controller('RootCtrl', ['$scope', '$http', '$interval', function($scope, $http, $interval) {

  console.log("Root ctrl");

  $scope.loadSongs = function() {
    $http.get('songs/').success(function(data) {
      $scope.songs = data;
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
     console.log("Retrieved current...");
     $scope.currSong = data;
   });
  };

  $scope.loadSongs();

  $interval($scope.getCurrSong, 1000);

}]);

