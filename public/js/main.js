var qApp = angular.module('qApp', ['ui.router']);

qApp.config(['$stateProvider', '$urlRouterProvider', "$locationProvider", "$httpProvider", function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

  var checkLoggedin = function($q, $timeout, $http, $location, $rootScope, $state){
    // Initialize a new promise
    var deferred = $q.defer();
    // Make an AJAX call to check if the user is logged in
    $http.get('/loggedin').success(function(user){
      // Authenticated
      if (user !== '0')
        /*$timeout(deferred.resolve, 0);*/
        deferred.resolve();
      // Not Authenticated
      else {
        $rootScope.message = 'You need to log in.';
        //$timeout(function(){deferred.reject();}, 0);
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
  $rootScope.message = '';

  // Logout function is available in any pages
  $rootScope.logout = function(){
    $rootScope.message = 'Logged out.';
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

qApp.controller('RootCtrl', ['$scope', '$rootScope', '$http', '$interval', function($scope, $rootScope, $http, $interval) {

  console.log("Root ctrl");

  $scope.socket = io();

  $scope.socket.on('refreshList', function(msg){
    $scope.loadSongs();
  });

  $scope.socket.on('songChanged', function(msg){
    $scope.loadSongs();
    console.log("Song changes");
    $rootScope.currSong = msg;
  });

  $scope.loadSongs = function() {
    $http.get('songs/').success(function(data) {
      $rootScope.songs = data;
    });
  };

  $scope.voteup = function(id) {
    $http.get('upvote/' + id).success(function(data) {
      console.log(data);
      $scope.socket.emit('voteup', '');
    });
  };

  $scope.getCurrSong = function(){
    $http.get('/songs/current').success(function(data) {
      $rootScope.currSong = data._name;
    });
  };

  $scope.loadSongs();
  $scope.getCurrSong();

}]);

qApp.controller('AdminCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

  console.log("Admin ctrl");

  $scope.player = {
    playing: false,
    paused: false
  };

  $scope.getPlayerState = function() {
    $http.get('/api/playing').success(function(data) {
      $scope.player.playing = data['playerState'];
      console.log($scope.player.playing);
    });
  };

  $scope.getPlayerState();

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

