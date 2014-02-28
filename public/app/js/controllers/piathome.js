'use strict;'

angular.module('piathome.controllers', ['ui.bootstrap','ngRoute','ngSanitize','ngAnimate'])
    .controller('MainCtrl', ['$scope','$rootScope', '$location','$window','$http','piUrls',
                    'cordovaReady' ,'cordovaPush','$interval','$timeout','screenlog','$route',
        function($scope,$rootScope, $location,$window,$http,piUrls,cordovaReady,cordovaPush,$interval,$timeout,screenlog, $route) {
           
            cordovaReady.then(function() {
                screenlog.debug("Cordova Service is Ready");
            });
            
            $rootScope.playlist=[];            
            
            $http.get(piUrls.mediaList,{}).success(function(data, status) {
                if (data.success) {
                    $rootScope.files = data.data;
                }
            }).error(function(data, status) {

            });
            
            $http.get('/indicator',{}).success(function(data,status){
                data = data.split(" ");
                
                console.log("memory used=" + data[data.length-2]);
                $scope.used= data[data.length-2];
                
            }).error(function(data , status){
                console.log('failed to  get indicator data');
                
                });
            

            $scope.goBack = function() {
                $window.history.back();
            };
            $scope.goHome = function() {
                $location.path('/');
            };
            $scope.doSearch = function() {
                $scope.showSearchField=!$scope.showSearchField;
                if (!$scope.showSearchField)
                    $scope.search = null;
            };

            $rootScope.$on('$locationChangeStart', function(scope, next, current){ 
                var subpath = next.slice(next.indexOf('#')+2);
                $scope.showBackButton = subpath.indexOf('/') >= 0;
                $scope.showSearchButton = false;
                $scope.showGroupButton = false;
                $scope.playbutton= false;
                $scope.pausebutton=false;
                $scope.showEditButton= false;
                    
                if (subpath.length == 0) {
                    $scope.showSearchField = false;
                    $scope.search = null;
                }                
                
                if (~next.indexOf('assets')) {
                    $scope.showEditButton= true;
                    $scope.editButtonText= 'Edit';
                }                
                if (~next.indexOf('edit')) {
                    $scope.editButtonText= "Done";
                }
                if (~next.indexOf('playlist')) {
                    $scope.showEditButton= false;
                    $scope.editButtonText= "Save";
                    
                    $scope.playbutton= true;
                    $scope.pausebutton=false;
                    $scope.playall= function(key){
                        $scope.playbutton= !$scope.playbutton;
                        $scope.pausebutton= !$scope.pausebutton;
                        $http.post('/playall',{ pressed : key }).success(function(data,success){
                            if (data.success) {
                                console.log('playall request sent');                                
                            }
                            }).error(function(data,status){
                            console.log('playall request failed');
                        })
                        
                    }
                }
            })

            $scope.$on('onlineStatusChange',function(event,status){
                $scope.onlineStatus = status?"green":"red";
            })            
            
            $scope.edit= function(e){
                if (e.target.innerText=='Save' && $location.path().indexOf('playlist') != '-1') {                    $scope.notify= true;
                    $scope.msg= "Saved Playlist!";
                    setTimeout(function () {
                        $scope.$apply(function () {
                            $scope.notify = "false";
                        });
                    }, 2500);
                    
                    var createplaylist=[];
                    $rootScope.playlist.forEach(function(itm){                        
                        if(itm.selected == true) createplaylist.push(itm);
                    });
                    $http.post(piUrls.playListWrite,
                        { playlist: (createplaylist.length)? createplaylist : '' }).success(function(data, status) {
                        if (data.success) {
                            console.log(data.stat_message);
                            $route.reload();
                        }
                    }).error(function(data, status) {
                        console.log(status);
                    });
                    $scope.playbutton= true;
                    $scope.showEditButton= $scope.pausebutton= false;
                }
                else if (e.target.innerText=='Edit' && $location.path().indexOf('assets') != '-1') {
                    $location.path($location.path()+"/edit/");
                }else{
                    $scope.goBack();
                }
            }         
    }]).
    controller('reportCtrl',['$scope',function($scope){
        $scope.$parent.$parent.title='Reports';
        $scope.$parent.$parent.button='edit';
    }]).
    controller('assetsCtrl',['$scope','$rootScope',
        function($scope, $rootScope){
            $scope.$parent.$parent.title='Assets';
            $scope.$parent.$parent.showEditButton= true;   
            $scope.done = function(files, data) {
                if(data.data != null) {
                    $rootScope.files.push(data.data.name);
                }
            }  
    }]).
    controller('assetViewCtrl',['$scope','$rootScope', '$http','piUrls', '$routeParams',
        function($scope, $rootScope, $http, piUrls, $routeParams){
            $scope.$parent.$parent.showEditButton= false;
            $http.get(piUrls.fileDetail,{ params: { file: $routeParams.file} }).success(function(data, status) {
            if (data.success) {
                $rootScope.filedetails = data.data;
                }
            }).error(function(data, status) {            
            });
            
            $scope.buttonshow = true;
            $scope.buttonhide = false;
            
            $scope.playFile = function(file , state) {
                console.log(file);
                $scope.buttonshow = !$scope.buttonshow  ;
                $scope.buttonhide = !$scope.buttonhide ;
                $http.post(piUrls.playFile,{file : file , state : state }).success(function(data, status) {
                    if (data.success) {
                        console.log(data.stat_message);
                    }
                }).error(function(data, status) {
                        console.log(status);
                    });
            }
            $scope.stopplay = function(){
                    $http.post(piUrls.playFile,{ playing : 'stop' }).success(function(data, status) {
                            if (data.success) {
                                console.log(data.stat_message);
                            }
                        }).error(function(data, status) {
                                console.log(status);
                            });
            }
            $scope.imageSrc= function(nme){
                return (nme)? (nme.match(/(jpg|jpeg|png|gif)$/gi)) ? "/media/"+nme : '/media/noimage.jpg': '';
            }
    }]).
    controller('assetsEditCtrl',['$scope', '$http', '$rootScope', 'piUrls', '$route',
        function($scope, $http, $rootScope, piUrls, $route){
            $scope.done = function(files, data) {
                if(data.data != null) {
                    $rootScope.files.push(data.data.name);
                }
            }            
            $scope.delete= function(file){                
                $http.post(piUrls.fileDelete,{ file: file }).success(function(data, status) {
                    if (data.success) {
                        $rootScope.files.splice($rootScope.files.indexOf(file),1);                        
                    }
                }).error(function(data, status) {            
                });                
            }            
            $scope.rename= function(file, index){
                $scope.filescopy= angular.copy($rootScope.files);
                $http.get(piUrls.fileRename, { params: { newname: file, oldname: $scope.filescopy[index]} })
                .success(function(data, status) {
                    if (data.success) {
                        $rootScope.files.splice($rootScope.files.indexOf($scope.filescopy[index]), 1 , file); 
                        $route.reload();
                    }
                }).error(function(data, status) {            
                });                                
            }
    }]).
    controller('playlistCtrl',['$scope', '$http', '$rootScope', 'piUrls', '$location',
        function($scope, $http, $rootScope, piUrls, $location){
        $scope.$parent.title='Playlist';
        
        $scope.$watch('playlistform.$dirty', function(newVal, oldVal) {
            if(newVal) {
                $scope.$parent.playbutton= $scope.$parent.pausebutton= false;                
                $scope.$parent.showEditButton= true;
            }
        });               
        
        $http.get(piUrls.mediaList,{params: {cururl: $location.path()} }).success(function(data, status) {
            if (data.success) {                
                $rootScope.playlist=[];
                if(data.data){
                    data.data.forEach(function(itm){
                        $rootScope.playlist.push({
                            filename: itm.filename || itm,
                            duration: itm.duration || 0,
                            selected: itm.selected || 'false',
                            deleted: itm.deleted || false
                        });                    
                    });
                }
            }
        }).error(function(data, status) {
        });
        
        $scope.sortableOptions = {
            update: function(e, ui) {
                $scope.$parent.playbutton= $scope.$parent.pausebutton= false;                
                $scope.$parent.showEditButton= true;
            }
        };
        
        $scope.imgChk= function(name){
            if(name.match(/(jpg|jpeg|png|gif)$/gi)){
                $scope.noimg= false;
                return true;
            }else{
                $scope.noimg=true
                return false;
            };
        }
    }]).
    controller('settingCtrl',['$scope',function($scope){        
        $scope.$parent.$parent.title='Setting';        
    }])
    
