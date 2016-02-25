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
     console.log("Retrieved current...");
     $scope.currSong = data;
   });
  };

  $scope.loadSongs();

  $interval($scope.getCurrSong, 1000);

}]);

qApp.controller('AdminCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

  console.log("Admin ctrl");

}]);

