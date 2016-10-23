/**
 * Created by Aditech on 1/11/2016.
 */
(function(){
    'use strict';

    angular
        .module('wontApp', [
            'ui.router',
            'ngAnimate',
            'ngMaterial',
            'ngCookies',
            'ngStorage',
            'ngRoute',
            'ngResource',
            'ngSanitize',
            'ui.bootstrap',
            'ngProgress',
            'ngJcrop',
            'lr.upload',
            'mobile-angular-ui',
            /* my dependencies */
            'home',
            'nav',
            'login',
            'register',
            'forgetpass',
            'resend_activation',
            /*logged */
            'comprofile',
            'homepage',
            'profile',
            'dictionary',
            'message',
            'settings',
            'makePost',
            'comments',
            'taah',
            'invite',
            'mainMiddle',
            'admin'
        ])
        .factory('authInterceptor', ['$q','$location', '$localStorage', function($q,$location, $localStorage) {
            return {
                'request': function (config) {
                    config.headers = config.headers || {};
                    if ($localStorage.w_token) {
                        config.headers.Authorization = 'Bearer ' + $localStorage.w_token;
                    }
                    return config;
                },
                'responseError': function(response) {
                    if(response.status === 401 || response.status === 403) {
                        $location.path('/login');
                    }
                    return $q.reject(response);
                }
            };
        }])
        .config(['$httpProvider',function($httpProvider){
            $httpProvider.interceptors.push('authInterceptor');
        }])
        .config(['$urlRouterProvider','$locationProvider',function ($urlRouterProvider,$locationProvider) {
            $urlRouterProvider.otherwise('/home');
            $locationProvider.html5Mode(true);
        }])
        .run(['$rootScope','ngProgressFactory','auth','$state',function ($rootScope,ngProgressFactory,auth,$state) {
            $rootScope.progressbar = ngProgressFactory.createInstance();
            $rootScope.$on('$stateChangeStart', function(){
                $rootScope.progressbar.start();
            });
            $rootScope.$on('$stateNotFound', function(){
                if(auth.isLoggedIn()){
                    $state.go('homepage');
                }else{
                    $state.go('home');
                }
            });
            $rootScope.$on('$stateChangeSuccess', function () {
                $rootScope.progressbar.complete();
                if(auth.isLoggedIn()){
                    $rootScope.$broadcast('state-change', {stateChange: true});
                }
            });
            $rootScope.$on('$stateChangeError', function(){
                $rootScope.progressbar.complete();
            });
            $rootScope.$on('$viewContentLoaded', function(){
                $rootScope.progressbar.complete();
            });
        }])
        .controller('mainController',['$scope','auth',function ($scope,auth) {
            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.isProcessing=false;
            $scope.loading=false;
            var a = document.getElementById('sheet');
            function layoutHandler() {
                if (window.innerWidth < 1024) {
                    if($scope.desktop){
                        $('#refresh').show();
                    }else{
                        $('#refresh').hide();
                    }
                } else {
                    if($scope.mobile){
                        $('#refresh').show();
                    }else{
                        $('#refresh').hide();
                    }
                }
            }
            function mediaMobile(){
                $scope.desktop = false;
                $scope.mobile = true;
                a.setAttribute("href", "libs/css/vendor-mobile.min.css");
            }
            window.onresize = layoutHandler;
            if (window.matchMedia('(max-width: 321px)').matches) {
                mediaMobile();
            } else if (window.matchMedia('(max-width: 361px)').matches) {
                mediaMobile();
            }else if (window.matchMedia('(max-width: 767px)').matches) {
                mediaMobile();
            } if (window.matchMedia('(max-width: 799px)').matches) {
                mediaMobile();
            } if (window.matchMedia('(max-width: 1024px)').matches) {
                mediaMobile();
            }else {
                a.setAttribute("href", "libs/css/vendor-desktop.min.css");
                $scope.desktop = true;
                $scope.mobile = false;
            }
            //RELOAD PAGE
            $scope.reloadPage = function () {
                window.location.reload();
            };

            //SUGGESTIONS
            $scope.revealCont = function (c) {
                var d = document.getElementById(c);
                d.style.height = d.style.height === "200px" ? "0px" : "200px";
            };
            $scope.Suname = "";
            $scope.Smessage = "";
            $scope.SaveSuggestion = function (uname,msg) {
                $scope.isProcessing=true;
                $scope.loading=true;
                if(auth.isLoggedIn()){
                    $scope.u = auth.currentUser().username;
                }else{
                    $scope.u = "";
                }
                auth.savesuggestions($scope.Suname,$scope.Smessage,$scope.u).success(function (data) {
                    swal("Thank you "+$scope.Suname,"We appreciate your contribution","success");
                    $scope.Suname = "";
                    $scope.Smessage = "";
                    $scope.isProcessing=false;
                    $scope.loading=false;
                }).error(function (data) {
                    swal("",data.message,"error");
                    $scope.isProcessing=false;
                    $scope.loading=false;
                });
            };
        }]);
})();
/*
 Author     : Tomaz Dragar
 Mail       : <tomaz@dragar.net>
 Homepage   : http://www.dragar.net
 */

(function ($) {

    $.fn.simpleCropper = function (onComplete) {

        var image_dimension_x = 600;
        var image_dimension_y = 600;
        var scaled_width = 0;
        var scaled_height = 0;
        var x1 = 0;
        var y1 = 0;
        var x2 = 0;
        var y2 = 0;
        var current_image = null;
        var image_filename = null;
        var aspX = 1;
        var aspY = 1;
        var file_display_area = null;
        var ias = null;
        var original_data = null;
        var jcrop_api;
        var bottom_html = "<input type='file' id='fileInput' name='files[]'/ accept='image/*'><canvas id='myCanvas' style='display:none;'></canvas><div id='modal'></div><div id='preview'><div class='buttons'><div class='cancel'></div><div class='ok'></div></div></div>";
        $('body').append(bottom_html);

        //add click to element
        this.click(function () {
            aspX = $(this).width();
            aspY = $(this).height();
            file_display_area = $(this);
            $('#fileInput').click();
        });

        $(document).ready(function () {
            //capture selected filename
            $('#fileInput').change(function (click) {
                imageUpload($('#preview').get(0));
                // Reset input value
                $(this).val("");
            });

            //ok listener
            $('.ok').click(function () {
                preview();
                $('#preview').delay(100).hide();
                $('#modal').hide();
                jcrop_api.destroy();
                reset();
            });

            //cancel listener
            $('.cancel').click(function (event) {
                $('#preview').delay(100).hide();
                $('#modal').hide();
                jcrop_api.destroy();
                reset();
            });
        });

        function reset() {
            scaled_width = 0;
            scaled_height = 0;
            x1 = 0;
            y1 = 0;
            x2 = 0;
            y2 = 0;
            current_image = null;
            image_filename = null;
            original_data = null;
            aspX = 1;
            aspY = 1;
            file_display_area = null;
        }

        function imageUpload(dropbox) {
            var file = $("#fileInput").get(0).files[0];

            var imageType = /image.*/;

            if (file.type.match(imageType)) {
                var reader = new FileReader();
                image_filename = file.name;

                reader.onload = function (e) {
                    // Clear the current image.
                    $('#photo').remove();

                    original_data = reader.result;

                    // Create a new image with image crop functionality
                    current_image = new Image();
                    current_image.src = reader.result;
                    current_image.id = "photo";
                    current_image.style['maxWidth'] = image_dimension_x + 'px';
                    current_image.style['maxHeight'] = image_dimension_y + 'px';
                    current_image.onload = function () {
                        // Calculate scaled image dimensions
                        if (current_image.width > image_dimension_x || current_image.height > image_dimension_y) {
                            if (current_image.width > current_image.height) {
                                scaled_width = image_dimension_x;
                                scaled_height = image_dimension_x * current_image.height / current_image.width;
                            }
                            if (current_image.width < current_image.height) {
                                scaled_height = image_dimension_y;
                                scaled_width = image_dimension_y * current_image.width / current_image.height;
                            }
                            if (current_image.width == current_image.height) {
                                scaled_width = image_dimension_x;
                                scaled_height = image_dimension_y;
                            }
                        }
                        else {
                            scaled_width = current_image.width;
                            scaled_height = current_image.height;
                        }

                        // set the image size to the scaled proportions which is required for at least IE11
                        current_image.style['width'] = scaled_width + 'px';
                        current_image.style['height'] = scaled_height + 'px';

                        // Position the modal div to the center of the screen
                        $('#modal').css('display', 'block');
                        var window_width = $(window).width() / 2 - scaled_width / 2 + "px";
                        var window_height = $(window).height() / 2 - scaled_height / 2 + "px";

                        // Show image in modal view
                        function mobileFile(){
                            $("#preview").css("top", '0px');
                            $("#preview").css("left", '0px');
                        }
                        $('#preview').show(500);
                        if (window.matchMedia('(max-width: 321px)').matches) {
                            mobileFile();
                        } else if (window.matchMedia('(max-width: 361px)').matches) {
                            mobileFile();
                        }else if (window.matchMedia('(max-width: 767px)').matches) {
                            mobileFile();
                        } if (window.matchMedia('(max-width: 799px)').matches) {
                            mobileFile();
                        } if (window.matchMedia('(max-width: 1024px)').matches) {
                            mobileFile();
                        }else {
                            $("#preview").css("top", window_height);
                            $("#preview").css("left", window_width);
                        }

                        // Calculate selection rect
                        var selection_width = 0;
                        var selection_height = 0;

                        var max_x = Math.floor(scaled_height * aspX / aspY);
                        //var max_y = Math.floor(scaled_width * aspY / aspX);


                        if (max_x > scaled_width) {
                            selection_width = scaled_width;
                            selection_height = (30.97893432 * selection_width) / 69.02106568;
                        }
                        else {
                            selection_width = max_x;
                            selection_height = (30.97893432 * selection_width) / 69.02106568;
                        }
                        //()
                        ias = $(this).Jcrop({
                            onSelect: showCoords,
                            onChange: showCoords,
                            bgColor: '#747474',
                            bgOpacity: .4,
                            aspectRatio: selection_width /selection_height,
                            setSelect: [0, 0, selection_width, selection_height]
                        }, function () {
                            jcrop_api = this;
                        });
                    }

                    // Add image to dropbox element
                    dropbox.appendChild(current_image);
                }

                reader.readAsDataURL(file);
            } else {
                dropbox.innerHTML = "File not supported!";
            }
        }

        function showCoords(c) {
            x1 = c.x;
            y1 = c.y;
            x2 = c.x2;
            y2 = c.y2;
        }

        function preview() {
            // Set canvas
            var canvas = document.getElementById('myCanvas');
            var context = canvas.getContext('2d');

            // Delete previous image on canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Set selection width and height
            var sw = x2 - x1;
            var sh = y2 - y1;


            // Set image original width and height
            var imgWidth = current_image.naturalWidth;
            var imgHeight = current_image.naturalHeight;

            // Set selection koeficient
            var kw = imgWidth / $("#preview").width();
            var kh = imgHeight / $("#preview").height();

            // Set canvas width and height and draw selection on it
            canvas.width = aspX;
            canvas.height = aspY;
            context.drawImage(current_image, (x1 * kw), (y1 * kh), (sw * kw), (sh * kh), 0, 0, aspX, aspY);

            // Convert canvas image to normal img
            var dataUrl = canvas.toDataURL();
            var imageFoo = document.createElement('img');
            imageFoo.src = dataUrl;

            // Append it to the body element
            $('#preview').delay(100).hide();
            $('#modal').hide();
            file_display_area.html('');
            file_display_area.append(imageFoo);

            if (onComplete) onComplete(
                {
                    "original": { "filename": image_filename, "base64": original_data, "width": current_image.width, "height": current_image.height },
                    "crop": { "x": (x1 * kw), "y": (y1 * kh), "width": (sw * kw), "height": (sh * kh) }
                }
            );
        }

        $(window).resize(function () {
            // Position the modal div to the center of the screen
            var window_width = $(window).width() / 2 - scaled_width / 2 + "px";
            var window_height = $(window).height() / 2 - scaled_height / 2 + "px";

            // Show image in modal view
            if (window.matchMedia('(max-width: 321px)').matches) {
                mobileFile();
            } else if (window.matchMedia('(max-width: 361px)').matches) {
                mobileFile();
            }else if (window.matchMedia('(max-width: 767px)').matches) {
                mobileFile();
            } if (window.matchMedia('(max-width: 799px)').matches) {
                mobileFile();
            } if (window.matchMedia('(max-width: 1024px)').matches) {
                mobileFile();
            }else {
                $("#preview").css("top", window_height);
                $("#preview").css("left", window_width);
            }
        });
    }
}(jQuery));
/**
 * Created by Aditech on 1/15/2016.
 */
(function(){
    //HOME CONTROLLER
    var homepageController = function ($scope,auth,$rootScope,$state,sub,vote,postedtimes,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        auth.allInfo()
            .success(function(data){
                if(!data.completeprofile){
                    $state.go('comprofile.pInfo');
                }else{
                    $scope.completeprocess = false;
                    $scope.luname = data.username;
                    $scope.username = data.username;
                }
            }).error(function(data){});
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        msub.statusVariables($scope,5,true,'hot');
        //HOT
        $scope.getAllHott = function () {
            msub.statusVariables($scope,5,true,'hot');
            $scope.hotContent();
        };
        $scope.hotContent = function(){
            sub.getAllHot($scope.limit).success(function (data) {
                msub.successfunc($scope,'h',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        $scope.hotContent();
        //NEW
        $scope.getAllNewt = function () {
            msub.statusVariables($scope,5,true,'new');
            $scope.newContent();
        };
        $scope.newContent = function () {
            sub.getAllNew($scope.limit).success(function (data) {
                msub.successfunc($scope,'n',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            })
        };
        //CONTROVERSY
        $scope.getAllCont = function (v) {
            msub.statusVariables($scope,5,true,'con');
            $scope.cv = v;
            $scope.conContent(v);
        };
        $scope.conContent = function (v) {
            console.log(v);
            sub.getAllCon($scope.limit,v.value).success(function (data) {
                msub.successfunc($scope,'c',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            })
        };
        //TOP
        $scope.getAllTopt = function (v) {
            msub.statusVariables($scope,5,true,'top');
            $scope.tv = v;
            $scope.topContent(v);
        };
        $scope.topContent = function (v) {
            sub.getAllTop($scope.limit,v.value).success(function (data) {
                msub.successfunc($scope,'t',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            })
        };
        //LOAD MORE CONTENT
        $scope.loadmore = function(type){
            $scope.mload = true;
            if(type === 'hot'){
                $scope.hotContent();
            }else if(type === 'new'){
                $scope.newContent();
            }else if(type === 'con'){
                $scope.conContent($scope.cv);
            }else if(type === 'top'){
                $scope.topContent($scope.tv);
            }
        };
        msub.subAlt($scope,vote,postedtimes);

        $scope.completed = false;
        $scope.$on('completeHome', function () {
            $scope.completed = true;
        });
        //MOBILE CONTENT DIALOG
        $scope.showContent = function (ev,id) {
            localStorage.setItem('content', JSON.stringify(id));
            msub.fulldialog(ev,'homepageController','partials/templates/mobile/content.mob.html');
        };
        //SUBMISSION DIALOG
        $scope.makeSubmission = function (ev) {
            msub.fulldialog(ev,'homepageController','partials/templates/mobile/makeSubmission.mob.html');
        };
        msub.scopeOnly($scope);
        if(localStorage["content"]){
            $scope.content = JSON.parse(localStorage["content"]);
        }
    };
    'use strict';

    angular.module('homepage', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('homepage', {
                    url: '/homepage' ,
                    templateUrl: 'partials/logged/home.html',
                    controller: 'homepageController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .controller('homepageController', ['$scope','auth','$rootScope','$state','sub','vote','postedtimes','msub', homepageController]);
})();
/**
 * Created by Aditech on 2/13/2016.
 */
/**
 * Created by Aditech on 1/27/2016.
 */
(function(){
    //NAV CONTROLLER
    var mainMiddleCtrl = function ($scope,auth,$state,user){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.isProcessing = false;
        $scope.limit = 5;
        //FETCH USER TAAHS
        $scope.online = function () {
            user.getFrOnline(1000).success(function (data) {
                $scope.onlfriends = data;
            });
            user.getFrFrnds($scope.limit).success(function (data) {
                $scope.friends = data;
            });
        };
        if(auth.isLoggedIn()) {
            $scope.online();
            //ON STATE CHANGE EVENT
            $scope.$on('state-change', function () {
                $scope.online();
            });
        }
    };
    'use strict';

    angular.module('mainMiddle', [])
        .controller('mainMiddleCtrl', ['$scope','auth','$state','user', mainMiddleCtrl]);
})();
/**
 * Created by Aditech on 1/11/2016.
 */
(function(){
    //HOME CONTROLLER
    var homeController = function ($scope,auth){
        $scope.isLoggedIn = auth.isLoggedIn;
    };
    'use strict';

    angular.module('home', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('home', {
                    url: '/home' ,
                    templateUrl: 'partials/home.html',
                    controller: 'homeController',
                    reloadOnSearch: false,
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(auth.isLoggedIn()){
                            $state.go('homepage');
                        }
                    }]
                });
        }])
        .controller('homeController', ['$scope','auth', homeController]);
})();
/**
 * Created by Aditech on 1/11/2016.
 */
(function(){
    //LOGIN CONTROLLER
    var loginController = function ($scope,$state,auth,msub){
        msub.Load($scope,false,false);
        $scope.isLoggedIn = auth.isLoggedIn;
        //CHECK USER LOGIN CREDENTIALS
        $scope.LoginUser = function(user){
            msub.Load($scope,true,true);
            auth.logIn(user).error(function(error){
                swal('Oops!',error.message,'error');
                msub.Load($scope,false,false);
            }).then(function(res){
                if(!res.data.user.firstname){
                    $state.go('comprofile.pInfo');
                }else{
                    $scope.$broadcast('userprofile-credentials');
                    $state.go('homepage');
                }
                msub.Load($scope,false,false);
            });
        };
    };
    'use strict';

    angular.module('login', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('login', {
                    url: '/login',
                    templateUrl: 'partials/login.html',
                    controller: 'loginController',
                    reloadOnSearch: false,
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(auth.isLoggedIn()){
                            $state.go('homepage');
                        }
                    }]
                });
        }])
        .controller('loginController', ['$scope','$state','auth','msub', loginController]);
})();
/**
 * Created by Aditech on 1/11/2016.
 */
(function(){
    // REGISTER CONTROLLER
    var registerController = function ($scope,$state,auth,msub){

        msub.Load($scope,false,false);
        $scope.isLoggedIn = auth.isLoggedIn;

        //CHECK USER REGISTRATION CREDENTIALS
        $scope.RegisterUser = function(user){
            msub.Load($scope,true,true);
            auth.register(user).error(function(error){
                swal('Oops!',error.message,'error');
                msub.Load($scope,false,false);
            }).then(function(){
                $state.go('comprofile.pInfo');
                msub.Load($scope,false,false);
            });
        };
    };
    'use strict';

    angular.module('register', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('register', {
                    url: '/register',
                    templateUrl: 'partials/register.html',
                    controller: 'registerController',
                    reloadOnSearch: false,
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(auth.isLoggedIn()){
                            $state.go('homepage');
                        }
                    }]
                });
        }])
        .controller('registerController', ['$scope','$state','auth','msub', registerController]);
})();
/**
 * Created by Aditech on 1/11/2016.
 */
(function(){
    //forgetpass CONTROLLER
    var forgetpassController = function ($scope,auth,msub){
        msub.Load($scope,false,false);
        $scope.isLoggedIn = auth.isLoggedIn;
        // POST USER EMAIL
        $scope.ResetPassword = function(user){
            msub.Load($scope,true,true);
            auth.forgetPass(user).success(function(){
                msub.Load($scope,false,false);
                $scope.click = 'message';
            }).error(function(error){
                swal('Oops!',error.message,'error');
                msub.Load($scope,false,false);
            });
        };
        //SWITCH VIEW
        $scope.Goback = function(){
            $scope.click = 'other';
        };
    };
    'use strict';

    angular.module('forgetpass', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('forgetpass', {
                    url: '/forgetpass',
                    templateUrl: 'partials/forgetPass.html',
                    controller: 'forgetpassController',
                    reloadOnSearch: false,
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(auth.isLoggedIn()){
                            $state.go('homepage');
                        }
                    }]
                });
        }])
        .controller('forgetpassController', ['$scope','auth','msub', forgetpassController]);
})();
/**
 * Created by Aditech on 1/11/2016.
 */
(function(){
    //ACTIVATION CONTROLLER
    var activationMailController = function ($scope,auth,msub){
        msub.Load($scope,false,false);
        $scope.isLoggedIn = auth.isLoggedIn;
        // POST USER EMAIL
        $scope.ResendActivation = function(user){
            msub.Load($scope,true,true);
            auth.resendActivation(user).success(function(){
                msub.Load($scope,false,false);
                $scope.click = 'message';
            }).error(function(error){
                swal('Oops!',error.message,'error');
                msub.Load($scope,false,false);
            });
        };
        //SWITCH VIEW
        $scope.Goback = function(){
            $scope.click = 'other';
        };
    };
    'use strict';

    angular.module('resend_activation', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('resend_activation', {
                    url: '/resend_activation',
                    templateUrl: 'partials/activateMail.html',
                    controller: 'activationMailController',
                    reloadOnSearch: false,
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(auth.isLoggedIn()){
                            $state.go('homepage');
                        }
                    }]
                });
        }])
        .controller('activationMailController', ['$scope','auth','msub', activationMailController]);
})();
/**
 * Created by Aditech on 1/11/2016.
 */
(function(){
    //NAV CONTROLLER
    var navController = function ($scope,auth,$state,user,$mdBottomSheet,msub){
        $scope.selectedItemChange = selectedItemChange;
        function selectedItemChange(item) {
            //$state.go('u.'+item.username);
        }
        //COMPLETE PROCESS
        $scope.$on('complete-process', function(evt ,data){$scope.completeprocess = data.completeprocess;});
        //LOGOUT
        $scope.logout = function(){auth.logOut().error(function () {}).then(function(){$state.go('login');})};

        $scope.userInfo1 = function () {
            msub.LogUserInfo($scope);
        };

        if(auth.isLoggedIn()) {
            $scope.getAllU = function () {
                user.getallUsers().success(function (data) {
                    $scope.users = data;
                    $scope.userInfo1();
                })
            };
            //ON STATE CHANGE EVENT
            $scope.$on('state-change', function () {
                $scope.userInfo1();
            });
            //GET ALL USERS
            $scope.getAllU();
            //USER PROFILE CREDENTIALS
            $scope.$on('userprofile-credentials', function(){
                $scope.getAllU();
            });
        }

        $scope.navStuff = function () {
            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.currentUser = auth.currentUser;
            //GET LOGGED IN USER TAAHS
            $scope.$on('get-user-taahs', function (evt, val) {
                $scope.taahs = val.taahs;
            });
            $scope.$on('new-message-check',function (evt,data){
                $scope.unreadCnt = data.unreadcnt;
            });
            $scope.$on('mark-as-read',function(){
                $scope.unreadCnt--;
            });
            $scope.$on('avatar-uploaded', function (evt,data) {
                $scope.currentUser.avatar = data.image;
            });
        };
        $scope.navStuff();
        //BOTTOM
        $scope.items = [
            { name: 'About Wontah', icon: 'ion-information-circled',ref:'about' },
            { name: 'Wontah, inc. Terms of Service', icon: 'ion-clipboard',ref:'terms-of-service' },
            { name: 'Wontah, inc. Privacy Policy', icon: 'ion-locked',ref:'privacy-policy' }
        ];
        $scope.listItemClick = function($index) {
            var clickedItem = $scope.items[$index];
            $mdBottomSheet.hide(clickedItem);
        };
        $scope.getSources = function() {
            $mdBottomSheet.show({
                templateUrl: 'partials/templates/mobile/source.html',
                controller: 'navController',
                clickOutsideToClose: true
            });
        }
        $scope.items2 = [
            { name: 'Documentation', icon: 'ion-clipboard',ref:'documentation' },
            { name: 'Wontah Blog', icon: 'ion-chatbox-working',ref:'blog' },
            { name: 'Get Support on Wontah', icon: 'ion-settings',ref:'how-it-works' }
        ];
        $scope.listItemClick2 = function($index) {
            var clickedItem = $scope.items2[$index];
            $mdBottomSheet.hide(clickedItem);
        };
        $scope.getStarted = function() {
            $mdBottomSheet.show({
                templateUrl: 'partials/templates/mobile/getStarted.html',
                controller: 'navController',
                clickOutsideToClose: true
            });
        };

        $scope.hideRight = function () {
            $scope.navStuff();
            $('.sidebar-right').hide();
            $('.sidebar-left').show();
            console.log(auth.currentUser());
        };
        $scope.hideLeft = function () {
            $scope.navStuff();
            $('.sidebar-right').show();
            $('.sidebar-left').hide();
            console.log(auth.currentUser());
        };
    };
    'use strict';

    angular.module('nav', ['requests'])
        .config(['$stateProvider', function($stateProvider){
            $stateProvider
                .state('terms-of-service',{
                    url: '/terms-of-service',
                    templateUrl: 'partials/wontah/terms_of_service.html',
                    reloadOnSearch: false
                })
                .state('about',{
                    url: '/about',
                    templateUrl: 'partials/wontah/about.html',
                    reloadOnSearch: false
                })
                .state('documentation',{
                    url: '/documentation',
                    templateUrl: 'partials/wontah/documentation.html',
                    reloadOnSearch: false
                })
                .state('blog',{
                    url: '/blog',
                    templateUrl: 'partials/wontah/blog.html',
                    reloadOnSearch: false
                })
                .state('status',{
                    url: '/status',
                    templateUrl: 'partials/wontah/status.html',
                    reloadOnSearch: false
                })
                .state('how-it-works', {
                    url: '/how-it-works',
                    templateUrl: 'partials/wontah/how-it-works.html',
                    reloadOnSearch: false
                })
                .state('privacy-policy',{
                    url: '/privacy-policy',
                    templateUrl: 'partials/wontah/privacy_policy.html',
                    reloadOnSearch: false
                });
        }])
        .controller('navController', ['$scope','auth','$state','user','$mdBottomSheet','msub', navController]);
})();
/**
 * Created by Aditech on 1/23/2016.
 */
(function(){
    //NAV CONTROLLER
    var requestsController = function ($scope,auth,$state,user,t,$rootScope,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        //NOTIFICATION BUTTON CLICK FUNCTION
        $scope.openNotifications = function () {
            user.updateCheck().then(function(){$scope.ncount = 0;});
        };
        //CHECK REQUESTS FUNC
        $scope.allrequests = function () {
            $scope.thereIsRequest = false;
            $scope.thereIsNofication = false;
            user.getRequests().then(function (res) {
                if (res.data.Request) {
                    $scope.thereIsRequest = true;
                    $scope.rcount = res.data.Rcount;
                    $scope.frndReq = res.data.person;
                    $scope.invTaah = res.data.tinvite;
                } else {
                    $scope.thereIsRequest = false;
                    $scope.rcount = 0;
                }
            });
            user.getNofications().then(function (res) {
                if (res.data.Notication) {
                    $scope.thereIsNofication = true;
                    $scope.ncount = res.data.Ncount;
                    $scope.nfications = res.data.nfications;
                } else {
                    $scope.thereIsNofication = false;
                    $scope.ncount = 0;
                }
            });
            user.checkpm().then(function (res) {
                $scope.unreadCnt = res.data.msgCount;
                $scope.newmsg = res.data.newMsg;
            });
        };
        //CHECK REQUESTS
        if(auth.isLoggedIn()){
            $scope.allrequests();
        }
        //ON STATE CHANGE EVENT
        $scope.$on('state-change', function () {
            if(auth.isLoggedIn()){
                $scope.allrequests();
            }
        });
        //ACCEPT REQUEST
        $scope.Accept = function (name) {
            $('#'+name+'_btns').hide();
            $('#'+name+'_load').show();
            $('#'+name+'_btns1').hide();
            $('#'+name+'_load1').show();
            user.accept(name)
                .success(function (data) {
                    $('#'+name+'_d').hide();
                    $('#'+name+'_load').hide();
                    $('#'+name+'_acpt').show();
                    $('#'+name+'_d1').hide();
                    $('#'+name+'_load1').hide();
                    $('#'+name+'_acpt1').show();
                    $scope.rcount--;
                }).error(function (data) {
                swal("", data.message, "error");
            });
        };
        //SUBSCRIBE
        $scope.Subscribe = function(taah, name){
            $('#'+taah+''+name+'_btns').hide();
            $('#'+taah+''+name+'_load').show();
            $('#'+taah+''+name+'_btns1').hide();
            $('#'+taah+''+name+'_load1').show();
            t.MakeSubscribtion(taah).then(function(response){
                if(!response.data.success){
                    swal('',response.data.message,'warning');
                }else{
                    $('#'+taah+''+name+'_d').hide();
                    $('#'+taah+''+name+'_load').hide();
                    $('#'+taah+''+name+'_acpt').show();
                    $('#'+taah+''+name+'_d1').hide();
                    $('#'+taah+''+name+'_load1').hide();
                    $('#'+taah+''+name+'_acpt1').show();
                    $scope.rcount--;
                    $rootScope.$broadcast('added-taah-to-taah-page');
                }
            });
        };
        //REJECT REQUEST
        $scope.Ignore = function (name) {
            $('#'+name+'_btns').hide();
            $('#'+name+'_load').show();
            $('#'+name+'_btns1').hide();
            $('#'+name+'_load1').show();
            user.ignore(name)
                .success(function (data) {
                    $scope.rcount--;
                    $('#'+name+'_d').hide();
                    $('#'+name+'_load').hide();
                    $('#'+name+'_rjct').show();
                    $('#'+name+'_d1').hide();
                    $('#'+name+'_load1').hide();
                    $('#'+name+'_rjct1').show();
                }).error(function (data) {
                swal("", data.message, "error");
            });
        };
        //IGNORE SUBSCRIPTION
        $scope.IgnoreNow = function(taah, name){
            $('#'+taah+''+name+'_btns').hide();
            $('#'+taah+''+name+'_load').show();
            $('#'+taah+''+name+'_btns1').hide();
            $('#'+taah+''+name+'_load1').show();
            t.ignoreTaah(taah).then(function(response){
                if(response.data.success){
                    $('#'+taah+''+name+'_d').hide();
                    $('#'+taah+''+name+'_load').hide();
                    $('#'+taah+''+name+'_rjct').show();
                    $('#'+taah+''+name+'_d1').hide();
                    $('#'+taah+''+name+'_load1').hide();
                    $('#'+taah+''+name+'_rjct1').show();
                    $scope.rcount--;
                }else{
                    swal("", response.data.msg, "warning");
                }
            });
        };
        //MARK ALL AS READ
        $scope.MarkAsRead = function(){
            user.markAllAsRead()
                .then(function () {
                    $scope.ncount = '0';
                    $scope.nfications = [];
                })
        };
        //MARK ONE AS SEEN
        $scope.markAsReadd = function(id ,index){
            user.MarkasRead(id)
                .then(function(){
                    $scope.nfications.splice(index, 1);
                });
        };
        //MOBILE
        //MOBILE NOTIFICATION
        $scope.showNotification = function (ev) {
            msub.fulldialog(ev,'requestsController','partials/templates/mobile/notification.mob.html');
        };
        //MOBILE REQUESTS
        $scope.showRequests = function (ev) {
            msub.fulldialog(ev,'requestsController','partials/templates/mobile/requests.mob.html');
        };
        msub.scopeOnly($scope);
    };
    'use strict';

    angular.module('requests', [])
        .controller('requestsController', ['$scope','auth','$state','user','taah','$rootScope','msub', requestsController]);
})();
/**
 * Created by Aditech on 1/15/2016.
 */
(function(){
    //HOME CONTROLLER
    var comprofileController = function ($scope,auth,$rootScope,user,$state,$localStorage){
        $scope.isLoggedIn = auth.isLoggedIn;
        auth.allInfo()
            .success(function(data){
                $scope.luname = data.username;
                $scope.lavatar = data.avatar;
                if(data.completeprofile){
                    $state.go('homepage');
                }
            }).error(function(data){});
        $rootScope.$broadcast('complete-process',{completeprocess: true});

        $scope.clickme = function () {
            $scope.click = 'steps';
        };
        //SWITCH VIEW
        $scope.Goback = function(){
            $scope.click = 'other';
        };
        $scope.$on('finished', function () {
            $scope.click = 'complete';
        });
        //EVENTS FROM CHILD CONTROLLERS
        //$scope.pIno = JSON.parse(localStorage["pInfo"]);
        $scope.$on('personal-info', function (evt , val) {
            localStorage.setItem('pInfo', JSON.stringify(val.pInfo));
        });
        $scope.$on('school-info', function (evt , val) {
            localStorage.setItem('schInfo', JSON.stringify(val.schoolInfo));
        });
        $scope.$on('friends-info', function (evt , val) {
            localStorage.setItem('frInfo', JSON.stringify(val.frInfo));
        });
        $scope.$on('avatar-info', function (evt , val) {
            localStorage.setItem('avaInfo', JSON.stringify(val.avaInfo));
        });
        $scope.$on('finished', function (){
            $scope.schInfo = localStorage["schInfo"];
            $scope.pInfo = localStorage["pInfo"];
            $scope.frInfo = localStorage["frInfo"];
            $scope.avaInfo = localStorage["avaInfo"];
            $scope.processing = true;
            user.saveInfo($scope.schInfo,$scope.pInfo,$scope.frInfo,$scope.avaInfo)
                .success(function(data){
                    $scope.processing = false;
                    localStorage.removeItem('schInfo');
                    localStorage.removeItem('frInfo');
                    localStorage.removeItem('pInfo');
                    if(data.message === 'ImageSuccess'){
                        $scope.user =JSON.parse($localStorage.user_t);
                        $scope.user.avatar = data.image;
                        $localStorage.user_t = JSON.stringify($scope.user);
                        var avatar = $(".avatar");
                        avatar.attr('src', '/user/'+$scope.luname+'/'+data.image);
                        avatar.addClass('avatar');
                        localStorage.removeItem('avaInfo');
                    }
                }).error(function (data) {
                swal('Oops!',data.message,'error');
            });
        });
        $scope.pInfo = localStorage["pInfo"];
        if($scope.pInfo){
            $scope.click = 'steps';
        }
        $scope.completeHome = function(){
            $rootScope.$broadcast('completeHome');
        };
        //Carousel
        $scope.myInterval = 3000;
        $scope.slides = [
            {
                image: '1'
            },
            {
                image: '2'
            },
            {
                image: '3'
            }
        ];
    };
    'use strict';

    angular.module('comprofile', ['pInfo','schInfo','frndSug','invite','avatar'])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('comprofile', {
                    url: '/comprofile' ,
                    templateUrl: 'partials/logged/comprofile.html',
                    controller: 'comprofileController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .run(['$rootScope','$state',function($rootScope, $state) {
            $rootScope.$state = $state;
        }])
        .controller('comprofileController', ['$scope','auth','$rootScope','user','$state','$localStorage', comprofileController]);
})();
/**
 * Created by Aditech on 1/15/2016.
 */
(function(){
    //PERSONAL INFO CONTROLLER
    var pInfoController = function ($scope,auth,$rootScope,$state){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.SubmitPform = function(user){
            if(user.firstname === "" || user.firstname === undefined ){
                swal('','You must enter your first name','error');
            }else if (user.lastname === "" || user.lastname === undefined){
                swal('','You must enter your last name','error');
            }else if(user.gender === "" || user.gender === undefined){
                swal('','You must enter your gender','error');
            }else{
                $rootScope.$broadcast('personal-info',{pInfo:user});
                $state.go('comprofile.schInfo');
            }
        }
    };
    'use strict';
    angular.module('pInfo', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('comprofile.pInfo', {
                    url: '/pInfo' ,
                    templateUrl: 'partials/logged/userInfo/pInfo/pInfo.html',
                    controller: 'pInfoController'
                });
        }])
        .controller('pInfoController', ['$scope','auth','$rootScope','$state', pInfoController]);
})();
/**
 * Created by Aditech on 1/15/2016.
 */
(function(){
    //SCH CONTROLLER
    var schInfoController = function ($scope,auth,$rootScope,$state,user,msub){

        $scope.isStudent = false;
        $scope.isStudentOfUg = true;
        $scope.selection = [];
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.depts = user.getAllDepts($scope);
        $scope.halls = user.getAllHalls($scope);

        $scope.NotStudent = function () {
            $scope.schoolInfo = {status: false};
            $rootScope.$broadcast('school-info',{schoolInfo:$scope.schoolInfo});
            $state.go('comprofile.avatar');
        };

        $scope.StudentofUg = function(){
            $scope.isStudent = true;
            $scope.isStudentOfUg = true;
        };

        $scope.NotStudentofUg = function(){
            $scope.isStudent = true;
            $scope.isStudentOfUg = false;
        };

        $scope.SubmitNotUgStudent = function(sch){
            $scope.sch = (sch === "" || sch === undefined) ? 'null' : sch;
            $scope.schoolInfo = {status: true, ug: false, name: $scope.sch};
            $rootScope.$broadcast('school-info',{schoolInfo:$scope.schoolInfo});
            $state.go('comprofile.avatar');
        };

        $scope.$on('dept-info', function (evt , val) {
            $scope.selection = val.selection;
            $scope.selectionId = val.selectionId;
        });

        $scope.toggleSelection = function(dept) {
            var idx = $scope.selection.indexOf(dept);
            if(idx > -1){$scope.selection.splice(idx, 1);}else{$scope.selection.push(dept);}
            $scope.selectionId = [];
            angular.forEach($scope.selection, function(value){
                $scope.selectionId.push(value._id);
            });
        };

        $scope.SubmitUgStudent = function (sub,t) {
            console.log($scope.selection);
            if(sub  === undefined || sub.hall === undefined || sub.hall === ""){
                swal("", "Hall not selected", "warning");
            }else if(sub  === undefined || sub.level === undefined || sub.level === ""){
                swal("", "Level not selected", "warning");
            }else if($scope.selection < 1){
                swal("", "Department not selected", "warning");
            }else{
                if(t === 'desktop'){
                    $scope.hId = sub.hall._id
                }else if(t === 'mobile'){
                    $scope.hId = JSON.parse(sub.hall)._id;
                }
                $scope.schoolInfo = {status: true, ug: true, name: "University of Ghana",level:sub.level,hall:$scope.hId,department:$scope.selectionId};
                $rootScope.$broadcast('school-info',{schoolInfo:$scope.schoolInfo});
                $state.go('comprofile.frndSug');
            }
        };
        //SHOW DIALOG
        $scope.showDeptDialog = function (ev) {
            msub.fulldialog(ev,'deptCtrl','partials/templates/mobile/dept.mob.html');
        };
        msub.scopeOnly($scope);
    };
    function deptCtrl($scope,$rootScope,user,$mdDialog,msub){
        $scope.dloading = true;
        $scope.depts = user.getAllDepts($scope);
        $scope.selection = [];
        $scope.toggleSelection = function(dept) {
            var idx = $scope.selection.indexOf(dept);
            if(idx > -1){$scope.selection.splice(idx, 1);}else{$scope.selection.push(dept);}
            $scope.selectionId = [];
            angular.forEach($scope.selection, function(value){
                $scope.selectionId.push(value._id);
            });
        };
        msub.scopeOnly($scope);
        $scope.hide = function() {
            $mdDialog.hide();
            $rootScope.$broadcast('dept-info',{selection: $scope.selection, selectionId: $scope.selectionId});
        };
        $scope.dloading = false;
    }
    'use strict';

    angular.module('schInfo', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('comprofile.schInfo', {
                    url: '/schInfo' ,
                    templateUrl: 'partials/logged/userInfo/schInfo/schInfo.html',
                    controller: 'schInfoController'
                });
        }])
        .controller('schInfoController', ['$scope','auth','$rootScope','$state','user','msub', schInfoController])
        .controller("deptCtrl",['$scope','$rootScope','user','$mdDialog','msub',deptCtrl]);
})();
/**
 * Created by Aditech on 1/15/2016.
 */
(function(){
    //SCH CONTROLLER
    var frndSugController = function ($scope,auth,user,$state,$rootScope){

        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.pIno = localStorage["schInfo"];

        if(!JSON.parse(localStorage['schInfo']).ug){
            $state.go('comprofile.avatar');
        }
        user.getSugFrnds($scope.pIno).success(function(data){
            $scope.sugFrnds = data.message;
            $scope.success = true;
        }).error(function (data) {
            $scope.success = false;
            $state.go('comprofile.avatar');
        });
        $scope.requestAll = function () {
            swal({
                    title: "",
                    text: "Are you sure you want to send request to all",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Send",
                    closeOnConfirm: false
                },
                function(){
                    if($scope.success){
                        $scope.frnames = [];
                        angular.forEach($scope.sugFrnds, function (value) {
                            $scope.frnames.push(value.username);
                        });
                        $rootScope.$broadcast('friends-info',{frInfo:$scope.frnames});
                    }
                    $state.go('comprofile.avatar');
                    swal('','','success');
                })
        };
        $scope.frndnames = [];
        $scope.addFriend = function (user) {
            swal({
                    title: "",
                    text: "Are you sure you want to send "+user+" a friendship request",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Send",
                    closeOnConfirm: false
                },
                function(){
                    if(!isInArray(user, $scope.frndnames)){
                        $scope.frndnames.push(user);
                    }
                    $rootScope.$broadcast('friends-info',{frInfo:$scope.frndnames});
                    swal('','','success');
                })

        };
        function isInArray(value, array) {
            return array.indexOf(value) > -1;
        }
    };
    'use strict';

    angular.module('frndSug', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('comprofile.frndSug', {
                    url: '/frndSug' ,
                    templateUrl: 'partials/logged/userInfo/frndSug/frndSug.html',
                    controller: 'frndSugController'
                });
        }])
        .controller('frndSugController', ['$scope','auth','user','$state','$rootScope', frndSugController]);
})();
/**
 * Created by Aditech on 1/15/2016.
 */
(function(){
    //SCH CONTROLLER
    var avatarController = function ($scope,auth){
        $scope.isLoggedIn = auth.isLoggedIn;
    };
    var AdvancedMarkupCtrl = function ($scope,auth,$rootScope,$state) {
        var button = $('.upload-avatar');
        $scope.uploaded = false;
        $scope.isProcessing = false;
        $scope.load = false;
        var interval;
        // Valid mimetypes
        $scope.acceptTypes = 'image/jpeg,image/png,image/gif';
        // Data to be sent to the server with the upload request
        $scope.uploadData = {
            myformdata: 'hello world'
        };
        $scope.onUpload = function (files) {
            $scope.isProcessing = true;
            $scope.load = true;
            // change button text, when user selects file
            button.text('Uploading');
            // Uploading -> Uploading. -> Uploading...
            interval = window.setInterval(function(){
                var text = button.text();
                if (text.length < 13){
                    button.text(text + '.');
                } else {
                    button.text('Uploading');
                }
            }, 200);
        };

        $scope.onError = function (response) {
            button.text('Change profile picture');
            window.clearInterval(interval);
            $scope.responseData = response.data;
        };

        $scope.onComplete = function (response) {
            window.clearInterval(interval);
            button.text('Change profile picture');
            $scope.filename = response.data.file;
            $scope.obj = {};
            $scope.obj.src = "uploads/"+$scope.filename;
            //[x, y, x2, y2, w, h]
            $scope.obj.selection = [76, 3, 523, 450, 447, 447];
            $scope.obj.thumbnail = true;
            $('#crop-section').show();
            $scope.uploaded = true;
            $scope.isProcessing = false;
            $scope.load = false;
            $('#uploader-section').hide();
        };

        $scope.SaveCropImage = function () {
            $scope.avatarInf = {selection:$scope.obj.selection,filename:$scope.filename};
            $rootScope.$broadcast('avatar-info',{avaInfo:$scope.avatarInf});
            $scope.uploaded = false;
            $state.go('comprofile.invite');
        };
    };
    'use strict';

    angular.module('avatar', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('comprofile.avatar', {
                    url: '/avatar' ,
                    templateUrl: 'partials/logged/userInfo/avatar/avatar.html',
                    controller: 'avatarController'
                });
        }])
        .config(function(ngJcropConfigProvider){
            ngJcropConfigProvider.setJcropConfig('upload', {
                bgColor: 'black',
                bgOpacity: .4,
                aspectRatio: 1,
                maxWidth: 600,
                maxHeight: 450
            });
        })
        .controller('avatarController', ['$scope','auth', avatarController])
        .controller('AppCtrl1', ['$scope' , function ($scope) {
            // App variable to show the uploaded response
            $scope.responseData = undefined;
        }])
        .controller('AdvancedMarkupCtrl1',['$scope','auth','$rootScope','$state', AdvancedMarkupCtrl]);
})();
/**
 * Created by Aditech on 1/15/2016.
 */
(function(){
    //SCH CONTROLLER
    var inviteController = function ($scope,auth,$rootScope){
        $scope.isLoggedIn = auth.isLoggedIn;
        //SWITCH VIEW
        $scope.Finish = function(device){
            $rootScope.$broadcast('finished');
            $scope.click = 'complete';
        }
    };
    'use strict';

    angular.module('invite', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('comprofile.invite', {
                    url: '/invite' ,
                    templateUrl: '../partials/logged/userInfo/invite.html',
                    controller: 'inviteController'
                });
        }])
        .controller('inviteController', ['$scope','auth','$rootScope', inviteController]);
})();
/**
 * Created by Aditech on 1/22/2016.
 */
(function () {
    'use strict';
    function userController($scope,$stateParams, $state, auth,user,$rootScope,$timeout,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.cimages = [];
        $scope.profile = true;
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        auth.allInfo()
            .success(function(data){
                if(!data.completeprofile){
                    $state.go('comprofile.pInfo');
                }else{
                    $scope.id = data._id;
                    $scope.luname = data.username;
                    $scope.lavatar = data.avatar;
                    $scope.lemail = data.email;
                    $scope.lstatus = data.school.status;
                    if($scope.lstatus){
                        $scope.lug = data.school.ug;
                    }
                }
            }).error(function(data){});

        $scope.userInfo = function () {
            user.profileInfo($stateParams.username).success(function (data) {
                $scope.cimages = [];
                $scope.u = data;
                $scope.username = data.username;
                $scope.firstname = data.firstname;
                $scope.lastname = data.lastname;
                $scope.email = data.email;
                $scope.website = data.website;
                $scope.contact = data.contact;
                $scope.bio = data.bio;
                $scope.gender = data.gender;
                $scope.cimages = data.coverImages;
                $scope.fcount = data.fcount;
                $scope.signup = data.signup;
                $scope.lastlogin = data.lastlogin;
                $scope.status = data.status;
                $scope.school = data.school;
                $scope.isFriend = data.isFriend;
                $scope.coverStyle = data.cover_style;
                data.gender === 'f' ? $scope.gen = 'Female' : $scope.gen = 'Male';
                $scope.coverStyle === '' ? $scope.coverStyle = 'rollIn' : $scope.coverStyle;
                if($scope.mobile){
                    if($scope.cimages === undefined){
                        $scope.cimages = ["../../../img/coverDefault.jpg"];
                    }
                }
                if ($scope.cimages.length < 1) {
                    $scope.cimages.push("../../../img/coverDefault.jpg");
                }
                console.log($scope.cimages);
                $scope.model = {move: $scope.coverStyle};
                $scope.model.transitions = [
                    {name: 'Bounce',type: 'bounce'},{name: 'Bounce down',type: 'bounceInDown'},{name: 'Bounce left',type: 'bounceInLeft'},
                    {name: 'Bounce right',type: 'bounceInRight'},{name: 'Bounce up',type: 'bounceInUp'},{name: 'Fade',type: 'fadeIn'},{name: 'Fade down',type: 'fadeInDown'},
                    {name: 'Fade down big',type: 'fadeInDownBig'},{name: 'Fade left',type: 'fadeInLeft'},{name: 'Fade left big',type: 'fadeInLeftBig'},{name: 'Fade right',type: 'fadeInRight'},
                    {name: 'Fade right big',type: 'fadeInRightBig'},{name: 'Fade up',type: 'fadeInUp'},{name: 'Fade up big',type: 'fadeInUpBig'},{name: 'Flash',type: 'flash'},
                    {name: 'Flip',type: 'flip'},{name: 'Flip x',type: 'flipInX'},{name: 'Flip y',type: 'flipInY'},{name: 'Light Speed',type: 'lightSpeedIn'},
                    {name: 'Pulse',type: 'pulse'},{name: 'Roll',type: 'rollIn'},{name: 'Rotate',type: 'rotateIn'},{name: 'Rotate down left',type: 'rotateInDownLeft'},
                    {name: 'Rotate down right',type: 'rotateInDownRight'},{name: 'Rotate up left',type: 'rotateInUpLeft'},{name: 'Rotate up right',type: 'rotateInUpRight'},{name: 'Shake',type: 'shake'},
                    {name: 'Swing',type: 'swing'},{name: 'Tada!',type: 'tada'},{name: 'Wobble',type: 'wobble'}

                ];
                $scope.model.images = $scope.cimages;
                $scope.tick = function () {
                    $scope.model.images.unshift($scope.model.images.pop());
                    $timeout($scope.tick, 8000);
                };
                $scope.tick();
                if (data.frndBlkUser) {
                    $state.go('homepage');
                }
            }).error(function () {
                $state.go('homepage');
            });
        };
        $scope.userInfo();

        $scope.changeCovers = function (ev) {
            msub.fulldialog(ev,'userController','partials/templates/mobile/coverPhotos.mob.html');
        };
        msub.sideNav($scope);
        msub.scopeOnly($scope);
        $state.go('u.room');
    }
    angular.module('profile', ['cover','request','more','about','friends','room'])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('u', {
                    url: '/u/:username',
                    templateUrl: 'partials/logged/user.html',
                    controller: 'userController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .run(['$rootScope','$state',function($rootScope, $state) {
            $rootScope.$state = $state;
        }])
        .controller('userController',['$scope','$stateParams','$state','auth','user','$rootScope','$timeout', 'msub',userController]);
})();
/**
 * Created by Aditech on 1/24/2016.
 */
(function(){
    //COVER CONTROLLER
    var coverController = function ($scope,auth,$state,user){
        $scope.isLoggedIn = auth.isLoggedIn;
        //SAVE TRANSITION
        $scope.saveTrans = function (t) {
            user.saveTransition(t.type).success(function(data){
                $scope.model.move = data.style;
            }).error(function(){
                $scope.coverStyle = 'rollIn';
            });
        };
        //SAVE COVER PHOTOS

        $scope.saveCoverImgs = function () {
            $scope.cImages = [];
            var i1 = document.getElementById('cover1').innerHTML;
            var i2 = document.getElementById('cover2').innerHTML;
            var i3 = document.getElementById('cover3').innerHTML;
            var i4 = document.getElementById('cover4').innerHTML;
            if(i1 !== ""){
                $scope.cImages.push($('#cover1 > img').attr('src'));
            }
            if(i2 !== ""){
                $scope.cImages.push($('#cover2 > img').attr('src'));
            }
            if(i3 !== ""){
                $scope.cImages.push($('#cover3 > img').attr('src'));
            }
            if(i4 !== ""){
                $scope.cImages.push($('#cover4 > img').attr('src'));
            }
            user.saveCImgs(JSON.stringify($scope.cImages)).success(function (data) {
                swal('great!',data.message,'success');
                $scope.cImages = [];
                $scope.userInfo();
            }).error(function(data){
                swal('Oops!',data.message,'warning');
                return;
            });
        };
        //REMOVE COVER IMAGE
        $scope.removeImage = function (image) {
            swal({
                    title: "Are you sure?",
                    text: "Are you sure you want to remove this image?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Remove",
                    closeOnConfirm: false
                },
                function(){
                    user.removeimage(image).success(function () {
                        var index = $scope.cimages.indexOf(image);
                        if (index > -1) {
                            $scope.cimages.splice(index, 1);
                        }
                        swal('great!',"image was removed successfully",'success');
                        $scope.userInfo();
                    }).error(function (data) {
                        swal('',data.message,'warning');
                    });
                });
        }

    };
    'use strict';

    angular.module('cover', [])
        .controller('coverController', ['$scope','auth','$state','user', coverController]);
})();
/**
 * Created by Aditech on 1/25/2016.
 */
(function(){
    //NAV CONTROLLER
    var requestController = function ($scope,auth,$state,user){
        $scope.isLoggedIn = auth.isLoggedIn;
        //REQUESTING FRIENDSHIP
        $scope.addFriend = function () {
            $scope.isLoadingFrnd = true;
            user.addfriend($scope.username).success(function () {
                swal('great!','Friend request sent successfully','success');
                $scope.isLoadingFrnd = false;
            }).error(function (data) {
                swal('',data.message,'error');
                $scope.isLoadingFrnd = false;
            });
        };
        //UN FRIEND
        $scope.unFriend = function () {
            swal({
                    title: "Are you sure?",
                    text: $scope.username+" will no longer be your friend",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: $scope.gender === 'f' ? "Yes, unfriend her" : "Yes, unfriend him",
                    closeOnConfirm: false
                },
                function(){
                    $scope.isLoadingFrnd = true;
                    user.unfriend($scope.username).success(function (data) {
                        swal("Unfriended!", "You're no longer a friend of "+$scope.username, "success");
                        $scope.isFriend = false;
                        $scope.isLoadingFrnd = false;
                    }).error(function (data) {
                        swal("",data.message, "error");
                        $scope.isLoadingFrnd = false;
                    });
                });
        };
        //BLOCK USER
        $scope.blockUser = function () {
            swal({
                    title: "Are you sure?",
                    text: $scope.username+" will not be able to view your profile",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: $scope.gender === 'f' ? "Yes, block her" : "Yes, block him",
                    closeOnConfirm: false
                },
                function(){
                    $scope.isLoadingBlked = true;
                    user.blockuser($scope.username).success(function (data) {
                        swal('great!',"You've successfully blocked "+$scope.username,'success');
                        $scope.isLoadingBlked = false;
                        $scope.isBlocked = true;
                    }).error(function (data) {
                        swal('',data.message,'error');
                        $scope.isLoadingBlked = false;
                    });
                });
        };
        //UNBLOCK USER
        $scope.unblockUser = function () {
            $scope.isLoadingBlked = true;
            user.unblockuser($scope.username).success(function (data) {
                swal("", "You've successfully unblocked "+$scope.username, "success");
                $scope.isLoadingBlked = false;
                $scope.isBlocked = false;
            }).error(function (data) {
                swal("",data.message);
                $scope.isLoadingBlked = false;
            });
        };
    };
    'use strict';

    angular.module('request', [])
        .controller('requestController', ['$scope','auth','$state','user', requestController]);
})();
/**
 * Created by Aditech on 1/25/2016.
 */
(function(){

    var roomController = function($scope,auth,$rootScope,vote,taah,postedtimes,msub,sub,$stateParams) {
        $scope.isLoggedIn = auth.isLoggedIn;
        msub.statusVariables($scope,5,true,'hot');
        $scope.name = $stateParams.username;
        //HOT
        $scope.getAllHott = function () {
            msub.statusVariables($scope,5,true,'hot');
            $scope.hotUserContent()
        };
        $scope.hotUserContent = function() {
            sub.getUserHot($scope.limit,$scope.name).success(function (data) {
                msub.successfunc($scope,'h',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        $scope.hotUserContent();
        //NEW
        $scope.getAllNewt = function () {
            msub.statusVariables($scope,5,true,'new');
            $scope.newUserContent();
        };
        $scope.newUserContent = function() {
            sub.getUserNew($scope.limit,$scope.name).success(function (data) {
                msub.successfunc($scope,'n',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        //CONTROVERSY
        $scope.getAllCont = function (v) {
            msub.statusVariables($scope,5,true,'con');
            $scope.cv = v;
            $scope.conUserContent($scope.cv);
        };
        $scope.conUserContent = function(v) {
            sub.getUserCon($scope.limit,v.value,$scope.name).success(function (data) {
                msub.successfunc($scope,'c',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        //TOP
        $scope.getAllTopt = function (v) {
            msub.statusVariables($scope,5,true,'top');
            $scope.tv = v;
            $scope.topUserContent($scope.tv);
        };
        $scope.topUserContent = function(v) {
            sub.getUserTop($scope.limit,v.value,$scope.name).success(function (data) {
                msub.successfunc($scope,'t',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        //SAVED
        $scope.getAllsavedt = function () {
            msub.statusVariables($scope,5,true,'saved');
            $scope.SavedUserContent();
        };
        $scope.SavedUserContent = function() {
            sub.getUserSaved($scope.limit,$scope.name).success(function (data) {
                msub.successfunc($scope,'s',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        //LOAD MORE CONTENT
        $scope.loadmore = function(type){
            $scope.mload = true;
            if(type === 'hot'){
                $scope.hotUserContent();
            }else if(type === 'new'){
                $scope.newUserContent();
            }else if(type === 'con'){
                $scope.conUserContent($scope.cv);
            }else if(type === 'top'){
                $scope.topUserContent($scope.tv);
            }
        };
        msub.subAlt($scope,vote,postedtimes);
    };
    'use strict';
    angular.module('room', [])
        .config(['$stateProvider', function($stateProvider){
            $stateProvider
                .state('u.room',{
                    url: '/room',
                    templateUrl: 'partials/logged/userprofile/room.html',
                    controller: 'roomController'
                });
        }])
        .controller('roomController',['$scope','auth','$rootScope','vote','taah','postedtimes','msub','sub','$stateParams', roomController]);
})();
/**
 * Created by Aditech on 1/25/2016.
 */
(function(){

    var friendsController = function($scope,auth,$rootScope,user) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.limit = 5;
        $scope.nofriends = false;
        $scope.friends = user.getFriends($scope.username,$scope.limit,$scope);

        $scope.getMorefriends = function () {
            $scope.load = true;
            $scope.friends = user.getFriends($scope.username,$scope.friends.limit,$scope);
            $scope.load = false;
        };
    };
    'use strict';
    angular.module('friends', [])
        .config(['$stateProvider', function($stateProvider){
            $stateProvider
                .state('u.friends',{
                    url: '/friends',
                    templateUrl: 'partials/logged/userprofile/friends.html',
                    controller: 'friendsController'
                });
        }])
        .controller('friendsController',['$scope','auth','$rootScope','user', friendsController]);
})();
/**
 * Created by Aditech on 1/25/2016.
 */
(function(){

    var aboutController = function($scope,auth,$rootScope) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.Allposts = [];

    };
    'use strict';
    angular.module('about', [])
        .config(['$stateProvider', function($stateProvider){
            $stateProvider
                .state('u.about',{
                    url: '/about',
                    templateUrl: 'partials/logged/userprofile/about.html',
                    controller: 'aboutController'
                });
        }])
        .controller('aboutController',['$scope','auth','$rootScope', aboutController]);
})();
/**
 * Created by Aditech on 1/25/2016.
 */
(function(){

    var moreController = function($scope,auth,$rootScope) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.Allposts = [];

    };
    'use strict';
    angular.module('more', [])
        .config(['$stateProvider', function($stateProvider){
            $stateProvider
                .state('u.more',{
                    url: '/more',
                    templateUrl: 'partials/logged/userprofile/more.html',
                    controller: 'moreController'
                });
        }])
        .controller('moreController',['$scope','auth','$rootScope', moreController]);
})();
/**
 * Created by Aditech on 1/27/2016.
 */
(function(){
    //NAV CONTROLLER
    var makePostController = function ($scope,auth,$state,user,sub,$rootScope,taah,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.isProcessing = false;
        $scope.limit = 5;
        //FETCH USER TAAHS
        if(auth.isLoggedIn()) {
            sub.getUserTaahs($scope).success(function (data) {
                $scope.taahs = data.subscribtions;
                $rootScope.$broadcast('get-user-taahs', {taahs: $scope.taahs});
            }).error(function (data) {
                $scope.taahs = data;
            });
            //FETCH ALL TAAHS
            taah.getAllTaahs().success(function (data) {
                $scope.alltaahs = data.taahs;
            }).error(function (data) {
                $scope.alltaahs = data;
            });
            $scope.friends = user.getFriends(auth.currentUser().username,$scope.limit,$scope);
        }
        //POPULATE TEXT INPUT BOX WITH A CLICK
        $scope.populateTah = function(name){
            $('#tahinput').val(name);
        };
        //POPULATE LINK INPUT BOX WITH A CLICK
        $scope.populateLTah = function(name){
            $('#linktah').val(name);
        };
        //POST A TEXT
        $scope.SubmitPost = function(post,taah){
            $scope.isProcessing = true;
            $scope.ploading = true;
            if(taah == 'main'){
                taah = $('#tahinput').val();
            }
            if(taah === ""){
                swal("",'You must select a taah',"warning");
                p();
            }else{
                sub.makePost(post,taah).success(function (data) {
                    swal('','submission was a success','success');
                    f();p();
                }).error(function (data) {
                    swal('',data.message,'warning');
                    f();p();
                });

            }
        };
        //POST LINK
        $scope.SubmitLink = function(post,taah){
            $scope.isProcessing = true;
            $scope.lloading = true;
            if(taah == 'main'){
                taah = $('#linktah').val();
            }
            if(taah === ""){
                swal("",'You must select a taah',"warning");
                p();
            }else{
                sub.newLink(post,taah).success(function (data) {
                    swal('','submission was a success','success');
                    f();p();
                }).error(function (data) {
                    swal('',data.message,'warning');
                    f();p();
                });
            }
        };
        //CREATE A TAAH
        $scope.CreateTaah = function(isValid,t){
            if(isValid){
                $scope.isProcessing = true;
                $scope.taahloading = true;
                taah.createTaah(t).success(function(data){
                    $rootScope.$broadcast('add-to-taah',{taahname:data.name});
                    swal('','taah was created successfully','success');
                    p();g();
                }).error(function (data) {
                    p();
                });
            }
        };
        //EDIT TAAH
        $scope.EditTaah = function(title,description,type,coption){
            $scope.isProcessing = true;
            $scope.taahloading = true;
            if(coption === '' || coption === undefined){
                swal("","Choose content option","warning");
                p();
                return false;
            }
            if(title === '' || title === undefined){
                swal("","Title is required","warning");
                p();
                return false;
            }
            if(type === '' || type === undefined){
                swal("","Choose a type","warning");
                p();
                return false;
            }
            taah.editTaah(title,description,type,coption,$scope.id).success(function(data){
                $scope.type = data.type;
                $scope.coption = data.contentOption;
                $scope.title = data.title;
                $scope.description = data.Description;
                p();
                swal('','Update was a success','success');
            }).error(function(data){
                swal('',data.message,'warning');
                p();
                return false;
            });
        };
        //MAKE A SUBSCRIPTION
        $scope.subscribeTaah = function () {
            taah.subscribeNow($scope.name).success(function (data) {
                if(data.success && !data.re){
                    swal("",data.message,"success");
                    $scope.member = true;
                    $scope.numOfUsers++;
                    $scope.taahs.push({name:$scope.name})
                }else if(data.success && data.re){
                    swal("","Your subscription is waiting approval","success");
                }else{
                    swal("",data.message,"warning");
                }
            }).error(function (data) {
                swal("",data.message,"error");
            });
        };
        //UN SUBSCRIBE
        $scope.unsubscribeTaah = function () {
            taah.unsubscribeNow($scope.name).success(function (data) {
                if(data.success){
                    swal("",data.message,"success");
                    $scope.numOfUsers--;
                }else{
                    swal("",data.message,"warning");
                }
                $scope.member = false;
            }).error(function (data) {
                swal("",data.message,"error");
            });
        };
        //INVITE FRIENDS
        $scope.InviteFriends = function(){
            $rootScope.$broadcast('invite-friends');
        };
        //GENERAL FUNCTIONS
        function p(){
            $scope.isProcessing = false;
            $scope.lloading = false;
            $scope.ploading = false;
            $scope.taahloading = false;
        }
        function f(){
            $('#textinput').val('');
            $('#ptitle').val('');
            $('#linkinput').val('');
            $('#ltitle').val('');
        }
        function g(){
            $('#taahname').val('');
            $('#taahdesc').val('');
            $('#taahtype').val('');
            $('#taahtitle').val('');
            $scope.taahloading = false;
        }
        //MOBILE
        //MOBILE REQUESTS
        $scope.createATaah = function (ev) {
            msub.fulldialog(ev,'makePostController','partials/templates/mobile/createTaah.mob.html');
        };
        $scope.showInvites = function (ev) {
            msub.fulldialog(ev,'makePostController','partials/templates/mobile/inviteFrnds.mob.html');
        };
        $scope.showSubscribers = function (ev) {
            msub.fulldialog(ev,'taahController','partials/templates/mobile/subscribers.mob.html');
        };
        $scope.ShowEditTaah = function (ev) {
            msub.fulldialog(ev,'taahController','partials/templates/mobile/editTaah.mob.html');
        };
        msub.scopeOnly($scope);
    };
    'use strict';
    angular.module('makePost', [])
        .controller('makePostController', ['$scope','auth','$state','user','sub','$rootScope','taah','msub', makePostController]);
})();
/**
 * Created by Aditech on 1/31/2016.
 */
(function () {
    'use strict';
    var commentsController = function ($scope,auth,$state,user,sub,$rootScope,$stateParams,vote) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.cposts = [];
        auth.allInfo()
            .success(function(data){
                if(!data.completeprofile){
                    $state.go('comprofile.pInfo');
                }else{
                    $scope.luname = data.username;
                }
            }).error(function(data){});
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        $scope.submission = function () {
            sub.getSubmission($stateParams.id).success(function (data) {
                $scope.id =  data.id;
                $scope.osid =  data.osid;
                $scope.author = data.author;
                $scope.anonymous = data.anonymous;
                $scope.type = data.type;
                $scope.ptype =  data.ptype;
                $scope.title =  data.title;
                $scope.data =  data.data;
                $scope.link =  data.link;
                $scope.taah =  data.taah;
                $scope.up =  data.up;
                $scope.down =  data.down;
                $scope.postdate =  data.postdate;
                $scope.avatar =  data.avatar;
                $scope.userVoted =  data.userVoted;
                $scope.voteStatus =  data.voteStatus;
                $scope.comments =  data.comments;
                $scope.saved =  data.saved;
                $scope.thumb =  data.thumb;
                $scope.hasreplies = true;
            }).error(function () {
                $state.go("homepage");
            });
        };
        $scope.submission();
        $scope.getComments = function () {
            sub.getcomments($stateParams.id).success(function (data) {
                $scope.hasreplies = true;
                angular.forEach(data, function(value){
                    $scope.cposts.push(value);
                });
            }).error(function (data) {
                $scope.hasreplies = false;
            });
        };
        $scope.getComments();
        //TOGGLE DATA
        $scope.isData  = true;
        $scope.showdata = function () {
            $scope.isdata = !$scope.isdata;
        };
        //UP VOTE
        $scope.upVotePost = function(id,t){
            vote.upvotes(id,$scope,t,$scope.hot='',$scope.new='',$scope.con='',$scope.top='',$scope.ussubs = '');
        };
        //DOWN VOTE
        $scope.downVotePost = function(id,t){
            vote.downvotes(id,$scope,t,$scope.hot='',$scope.new='',$scope.con='',$scope.top='',$scope.ussubs = '');
        };
        //SAVE POST
        $scope.SavePost = function(id,t){
            vote.save(id,t,$scope,$scope.new='',$scope.con='',$scope.top='',$scope.ussubs = '');
        };
        //UNSAVE POST
        $scope.unSavePost = function(id,t){
            vote.unsave(id,t,$scope,$scope.new='',$scope.con='',$scope.top='',$scope.ussubs = '');
        };
        //REPLY TO MAIN POST
        $scope.mainReply = function(reply){
            if(reply.text === ""){
                swal("","fill the form data","warning");
                return false;
            }
            $scope.isProcessing = true;
            $scope.mrload = true;
            sub.replymsub(reply,$scope.id).success(function(data){
                $('#replytext').val('');
                $scope.mrload = false;
                $scope.isProcessing = false;
                $scope.hasreplies = true;
                reply.text = '';
                $scope.cposts.push(data);

            }).error(function (data) {
                swal("",data.msg,"warning");
                $scope.mrload = false;
                $scope.isProcessing = false;
                $scope.hasreplies = false;
            });
        };
        //SHOW SUB REPLY
        $scope.showSubReply = function(id){
            $('#subrep_'+id).show();
        };
        //DISMISS SUB REPLY FORM
        $scope.dismissForm = function(id){
            $('#subrep_'+id).hide();
            $('#replytext_'+id).val('');
        };
        //REPLY TO SUB POST
        $scope.makeSubPost = function(rep,id){
            if($("#replytext_"+id).val() === ""){
                swal("","fill the form data","warning");
                return false;
            }
            $scope.isProcessing = true;
            $scope.srloading = true;
            sub.replyssub(rep,$scope.id,id).success(function (data) {
                $("#replytext_"+id).val('');
                $('#subrep_'+id).hide();
                $scope.isProcessing = false;
                $scope.srloading = false;
                angular.forEach($scope.cposts, function(value){addcommentsfunc($scope.cposts,value,id,data);});
            }).error(function () {
                swal("",data.msg,"warning");
                $scope.isProcessing = false;
                $scope.srloading = false;
            });
        };
        //ADD COMMENTS FUNCTION
        function addcommentsfunc(main, value, id, data){
            if(value.id === id){
                value.childs.push(data);
            }
            if(value.childs !== []){
                angular.forEach(value.childs, function(val){addcommentsfunc(value.childs,val,id,data);});
            }
        }
        //REMOVE COMMENT
        $scope.removecomment = function(id,index,t){
            swal({
                    title: "",
                    text: "Are you sure you want to remove this comment?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Remove",
                    closeOnConfirm: false
                },
                function(){
                    vote.remove(id,index,t,$scope.cposts,$scope.mm='',$stateParams.id,$scope.top="",$scope.ussubs = '');
                });
        };
    };

    angular.module('comments', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('comments', {
                    url: '/comments/:id' ,
                    templateUrl: 'partials/logged/subs/comments.html',
                    controller: 'commentsController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .controller('commentsController', ['$scope','auth','$state','user','sub','$rootScope','$stateParams','vote', commentsController]);
})();
/**
 * Created by Aditech on 1/31/2016.
 */
(function () {
    'use strict';
    var taahController = function ($scope,auth,$state,user,sub,$rootScope,$stateParams,vote,taah,postedtimes,msub) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.limit = 5;
        auth.allInfo()
            .success(function(data){
                if(!data.completeprofile){
                    $state.go('comprofile.pInfo');
                }else{
                    $scope.luname = data.username;
                    $scope.username = data.username;
                }
            }).error(function(data){});
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        $scope.getTaahbyname = function () {
            taah.gettaahbyname($stateParams.name).success(function (data) {
                $scope.id = data.id;
                $scope.name = data.name;
                $scope.type = data.type;
                $scope.coption = data.coption;
                $scope.title = data.title;
                $scope.description = data.Description;
                $scope.creator = data.creator;
                $scope.numOfUsers = data.numOfUsers;
                $scope.logo = data.logo;
                $scope.date = data.createddate;
                $scope.member = data.member;
                $scope.restricted = data.restricted;
                $scope.resInfo = data.resInfo;
                $scope.admin = data.admin;
                if($scope.type == 'pr' && $scope.member === false){
                    $state.go('homepage');
                }
            }).error(function () {
                $state.go('homepage');
            });
            if($scope.type == 'pr' && $scope.member === false){
                $state.go('homepage');
            }
        };
        $scope.getTaahbyname();
        msub.statusVariables($scope,5,true,'hot');
        //HOT
        $scope.getAllHott = function () {
            msub.statusVariables($scope,5,true,'hot');
            $scope.hotTaahContent()
        };
        $scope.hotTaahContent = function() {
            sub.getTaahHot($scope.limit,$stateParams.name).success(function (data) {
                msub.successfunc($scope,'h',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        $scope.hotTaahContent();
        //NEW
        $scope.getAllNewt = function () {
            msub.statusVariables($scope,5,true,'new');
            $scope.newTaahContent();
        };
        $scope.newTaahContent = function() {
            sub.getTaahNew($scope.limit,$stateParams.name).success(function (data) {
                msub.successfunc($scope,'n',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        //CONTROVERSY
        $scope.getAllCont = function (v) {
            msub.statusVariables($scope,5,true,'con');
            $scope.cv = v;
            $scope.conTaahContent($scope.cv);
        };
        $scope.conTaahContent = function(v) {
            sub.getTaahCon($scope.limit,v.value,$stateParams.name).success(function (data) {
                msub.successfunc($scope,'c',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        //TOP
        $scope.getAllTopt = function (v) {
            msub.statusVariables($scope,5,true,'top');
            $scope.tv = v;
            $scope.topTaahContent($scope.tv);
        };
        $scope.topTaahContent = function(v) {
            sub.getTaahTop($scope.limit,v.value,$stateParams.name).success(function (data) {
                msub.successfunc($scope,'t',data);
            }).error(function (data) {
                msub.errorfunc($scope,data);
            });
        };
        //LOAD MORE CONTENT
        $scope.loadmore = function(type){
            $scope.mload = true;
            if(type === 'hot'){
                $scope.hotTaahContent();
            }else if(type === 'new'){
                $scope.newTaahContent();
            }else if(type === 'con'){
                $scope.conTaahContent($scope.cv);
            }else if(type === 'top'){
                $scope.topTaahContent($scope.tv);
            }
        };
        msub.subAlt($scope,vote,postedtimes);
        msub.sideNav($scope);

    };
    angular.module('taah', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('t', {
                    url: '/t/:name' ,
                    templateUrl: 'partials/logged/taah/taah.html',
                    controller: 'taahController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .controller('taahController', ['$scope','auth','$state','user','sub','$rootScope','$stateParams','vote','taah','postedtimes','msub', taahController]);
})();
/**
 * Created by Aditech on 2/2/2016.
 */
(function () {
    'use strict';
    var InviteController = function ($scope,auth,$rootScope,sub,taah,user,$stateParams,msub) {
        $scope.limit = 5;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.nofriends = false;
        $scope.selection = [];
        $scope.selection2 = [];
        //INVITE FRIENDS
        $scope.$on('invite-friends',function(){
            $scope.inviteLoading = true;
            $scope.friends = user.getFriends($scope.luname,$scope.limit,$scope);
            $scope.inviteLoading = false;
        });
        //LOAD MORE FRIENDS
        $scope.loadMorefriends = function () {
            $scope.load = true;
            $scope.friends = user.getFriends(auth.currentUser().username,$scope.friends.limit,$scope);
            $scope.load = false;
        };
        //FRIEND SELECTION
        $scope.toggleSelection = function(name) {
            $scope.toggle(name,$scope.selection);
        };
        //TAAH SELECTION
        $scope.toggleSelection2 = function(name) {
            $scope.toggle(name,$scope.selection2);
        };
        //TOGGLE SELECTION FUNCTION
        $scope.toggle = function(name,array){
            var idx = array.indexOf(name);
            if(idx > -1){
                array.splice(idx, 1);
            }else{
                array.push(name);
            }
            $scope.selectionId = [];
            angular.forEach(array, function(value){
                $scope.selectionId.push(value);
            });
        };
        //INVITE FRIENDS FUNC
        $scope.InviteNow = function(){
            if($scope.selection < 1){
                swal('',"You've not selected any person" ,'warning');
            }else{
                taah.InviteFrnds(JSON.stringify($scope.selectionId),$stateParams.name).success(function(data){
                    swal('', data.message,'success');
                }).error(function (data) {
                    swal('', data.message,'warning');
                });
            }
            console.log($scope.selectionId);
        };
        //INVITE FRIEND FUNC
        $scope.InviteFriend = function(){
            if($scope.selection2 < 1){
                swal('',"You've not selected any taah" ,'warning');
            }else{
                taah.inviteFrnd(JSON.stringify($scope.selectionId),$stateParams.username).success(function(data){
                    swal('', data.message,'success');
                }).error(function (data) {
                    swal('', data.message,'warning');
                });
            }
            console.log($scope.selectionId);
        };
        //ACCEPT SUBSCRIPTION
        $scope.AcceptSub = function(name){
            $('#'+name+'_btns').hide();
            $('#'+name+'_load').show();
            taah.acceptSub(name,$stateParams.name).success(function (data) {
                $('#'+name+'_d').hide();
                $('#'+name+'_load').hide();
                $('#'+name+'_acpt').show();
            }).error(function (data) {

            });
        };
        //DENY SUBSCRIPTION
        $scope.IgnoreSub = function(name){
            $('#'+name+'_btns').hide();
            $('#'+name+'_load').show();
            taah.ignoreSub(name,$stateParams.name).success(function (data) {
                $('#'+name+'_d').hide();
                $('#'+name+'_load').hide();
                $('#'+name+'_rjct').show();
            }).error(function (data) {

            });
        };
        msub.scopeOnly($scope);
    };
    angular.module('invite')
        .controller('InviteController',['$scope','auth','$rootScope','sub','taah','user','$stateParams','msub',InviteController]);
})();
/**
 * Created by Aditech on 1/23/2016.
 */
(function(){
    //HOME CONTROLLER
    var dictionaryController = function ($scope,auth,$rootScope,$state,dict,SchUsers,user,opt,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        auth.allInfo().success(function(data){
            if(!data.completeprofile){
                $state.go('comprofile.pInfo');
            }else if(!data.school.ug){
                $state.go('homepage');
            }
        });
        //GET ALL STUDENTS
        $scope.SchUsers = SchUsers;
        //GET DEPARTMENT
        user.getAlldpts().success(function (data) {
            $scope.depts = [{'name':'All',id:'1',_id:'1'}];
            $scope.depts = $scope.depts.concat(data);
        });
        //GET HALLS
        user.getAllhlls().success(function (data) {
            $scope.halls = [{'name':'All',id:'1',_id:'1'}];
            $scope.halls = $scope.halls.concat(data);
        });
        //GET LEVELS
        $scope.levels = opt.lvl();
        //GET GENDERS
        $scope.genders = opt.gender();
        //LISTEN TO EVENTS FROM CHILD CONTROLLER
        $scope.$on('dictloading',function(evt,data){
            $scope.dictloading = data.dictloading;
        });
        //selectA
        $scope.$on('selectA-hasStd',function(evt,data){
            $scope.dictloading = data.dictloading;
            $scope.SchUsers = data.SchUsers;
        });
        $scope.$on('selectA-noStd',function(evt,data){
            $scope.dictloading = data.dictloading;
            $scope.SchUsers = data.SchUsers;
        });
        //TOGGLE RIGHT
        msub.sideNav($scope);
    };
    'use strict';
    dictionaryController.resolve = {
        SchUsers: ['dict', function (dict) {
            return dict.getAllUgStudents()
                .then(function (res) {
                    if (res.data.students) {
                        return {
                            data: res.data.ugstd,
                            isStudent:  res.data.students
                        }
                    }else{
                        return {
                            data: res.data.message,
                            isStudent:  res.data.students
                        }
                    }
                });
        }]
    };
    angular.module('dictionary', ['dfilter'])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('wontahdict', {
                    url: '/wontahdict',
                    templateUrl: 'partials/logged/dictionary/wontahdict.html',
                    controller: 'dictionaryController',
                    resolve: dictionaryController.resolve,
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .controller('dictionaryController', ['$scope','auth','$rootScope','$state','dict','SchUsers','user','opt', 'msub', dictionaryController])
})();
/**
 * Created by Aditech on 2/9/2016.
 */
(function(){
    'use strict';

    var filterController = function ($scope,auth,dict,$rootScope,opt){
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.filters = false;
        $scope.showFilters = function () {
            $scope.filters = true;
        };

        $scope.options = opt.options();

        $scope.SelectOption = function(type ,t) {
            var opt;
            console.log(type.name);
            if (type.name === 'Department') {
                opt = $scope.depts;
            }
            else if (type.name === 'Hall') {
                opt = $scope.halls;
            }
            else if (type.name === 'Level') {
                opt= $scope.levels;
            }
            else if (type.name === 'Gender') {
                opt = $scope.genders;
            }
            else if (type.selectA === 'All') {
                opt = "";
            }
            if(t === 'selectA'){
                $scope.t1 = type.value;
                $scope.optionsA = opt;
                $scope.itm1 = undefined;
                console.log($scope.optionsA);
                $scope.options1 = [{'name':'All'}];
                $scope.options2 = [];$scope.options3 = [];
                $scope.optionsB = [];$scope.optionsC = [];$scope.optionsD = [];
                $scope.filterNow($scope.options,$scope.options1,type);
            }else if(t === 'selectB'){
                $scope.t2 = type.value;
                $scope.itm2 = undefined;
                $scope.optionsB = opt;
                $scope.options2 = [{'name':'All'}];
                $scope.options3 = [];$scope.optionsC = [];$scope.optionsD = [];
                $scope.filterNow($scope.options1,$scope.options2,type);
            }else if(t === 'selectC'){
                $scope.t3 = type.value;
                $scope.itm3 = undefined;
                $scope.optionsC = opt;
                $scope.optionsD = [];$scope.options3 = [{'name':'All'}];
                $scope.filterNow($scope.options2,$scope.options3,type);
            }else if(t === 'selectD'){
                $scope.t4 = type.value;
                $scope.optionsD = opt;
                $scope.itm4 = undefined;
            }
        };

        $scope.SelectA = function (item) {
            $scope.loadN();
            $scope.itm1 = (item._id === undefined) ? 1 : item._id;
            dict.FirstFilter($scope.itm1, $scope.t1).then(function (res) {
                if(res.data.students){
                    $scope.optionsB = [];$scope.optionsC = [];$scope.optionsD = [];
                    $scope.isStudentN(res.data.ugstd);
                }else{
                    $scope.isNotStudentN();
                }
            });
        };
        $scope.SelectB = function(item){
            $scope.loadN();
            $scope.itm2 = (item._id === undefined) ? 1 : item._id;
            check($scope.itm2);
            dict.SecondFilter($scope.itm1, $scope.t1,$scope.itm2,$scope.t2).then(function(res){
                if(res.data.students){
                    $scope.optionsC = [];$scope.optionsD = [];
                    $scope.isStudentN(res.data.ugstd);
                }else{
                    $scope.isNotStudentN();
                }
            });
        };
        $scope.SelectC = function(item){
            $scope.loadN();
            $scope.itm3 = (item._id === undefined) ? 1 : item._id;
            check($scope.itm3);
            dict.ThirdFilter($scope.itm1, $scope.t1,$scope.itm2,$scope.t2,$scope.itm3,$scope.t3).then(function(res){
                if(res.data.students){
                    $scope.optionsD = [];
                    $scope.isStudentN(res.data.ugstd);
                }else{
                    $scope.isNotStudentN();
                }
            });
        };
        $scope.SelectD = function(item){
            $rootScope.$broadcast('dictloading',{
                dictloading: true
            });
            $scope.itm4 = (item._id === undefined) ? 1 : item._id;
            check($scope.itm4);
            dict.FourthFilter($scope.itm1, $scope.t1,$scope.itm2,$scope.t2,$scope.itm3,$scope.t3,$scope.itm4,$scope.t4).then(function(res){
                if(res.data.students){
                    $scope.isStudentN(res.data.ugstd);
                }else{
                    $scope.isNotStudentN();
                }
            });
        };
        //FUNCTIONS
        $scope.loadN = function () {
            $rootScope.$broadcast('dictloading',{dictloading: true});
        };
        $scope.isStudentN = function (a) {
            $rootScope.$broadcast('selectA-hasStd', {
                dictloading: false,
                SchUsers:{
                    isStudent: true,
                    data: a
                }
            });
        };
        $scope.isNotStudentN = function () {
            $rootScope.$broadcast('selectA-noStd',{
                dictloading: false,
                SchUsers:{
                    isStudent:false
                }
            });
        };
        $scope.filterNow = function (a,b,t) {
            angular.forEach(a,function(value){
                if(value.name !== t.name && value.name !== 'All'){
                    b.push(value);
                }
            });
        };
        function check(a){
            if(a === undefined){
                a = '1';
            }
        }
    };
    angular.module('dfilter', [])
        .controller('filterController', ['$scope','auth','dict','$rootScope','opt', filterController]);
})();
/**
 * Created by Aditech on 1/23/2016.
 */
(function(){
    //MESSAGE CONTROLLER
    var msgController = function ($scope,auth,$rootScope,$state,user,$sanitize,inbox,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.pmload = false;
        $scope.isInboxOpen = false;
        $scope.isProcessing = false;
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        auth.allInfo()
            .success(function(data){
                if(!data.completeprofile){
                    $state.go('comprofile.pInfo');
                }else{
                    $scope.luname = data.username;
                }
            }).error(function(data){});
        //TOGGLE SCREEN
        $scope.fullscreen = false;
        $scope.FullScreenToggle = function(){
            $scope.fullscreen = !$scope.fullscreen;
        };
        //GET ALL USERS
        $scope.p = {};
        user.getallUsers().success(function (data) {$scope.p.options = data;});
        //MESSAGE BODY
        $scope.form = {};
        $scope.htmlcontent = $scope.orightml;
        $scope.disabled = false;
        //SHOW RICH TEXT BAR
        $scope.notshown = true;
        $scope.showTextBar = function(){
            if($scope.notshown){
                $('.ta-toolbar .btn-group').show();
                $scope.notshown = false;
            }else{
                $('.ta-toolbar .btn-group').hide();
                $scope.notshown = true;
            }
        };
        //SAVE MESSAGE
        $scope.SaveinboxMessage = function (sub,to) {
            $scope.pmload = true;
            if(to === '' || to === undefined){
                $scope.doneMsg('Recipient not select','warning');
            }else if(sub === '' || sub === undefined){
                $scope.doneMsg('Title required','warning');
            } else if($scope.luname === to){
                $scope.doneMsg('You cannot send message to your self','warning');
            }else{
                $scope.msg =  $sanitize($('#messagebox').val());
                inbox.sendMessage(to,sub,$scope.msg).success(function (data) {
                    $('#to').val('');
                    $('#subject').val('');
                    $('#messagebox').val('');
                    $('.ta-editor').val('');
                    $('.ta-editor').html('');
                    $scope.isInboxOpen = false;
                    $scope.doneMsg('message was sent successfully','success');
                }).error(function (data) {
                    $scope.doneMsg(data.message,'error');
                });
            }
        };
        $scope.doneMsg = function(msg,type){
            swal('',msg,type);
            $scope.pmload = false;
            $scope.isProcessing = false;
            return false;
        }
        //MARK AS READ
        $scope.$on('mark-as-read',function(){
            $scope.unreadCnt--;
        });
        //CHECK UNREAD
        $scope.$on('new-message-check',function (evt,data){
            $scope.unreadCnt = data.unreadcnt;
        });
        //TOGGLE RIGHT
        msub.sideNav($scope);
        //SENT A MESSAGE
        $scope.messageModal = function (ev) {
            msub.fulldialog(ev,'msgController','partials/templates/mobile/msg.mob.html');
        };
        msub.scopeOnly($scope);
    };
    'use strict';

    angular.module('message', ['sentmsg','received','notifications','onemsg','textAngular'])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('pm', {
                    url: '/pm',
                    templateUrl: 'partials/logged/message/message.html',
                    controller: 'msgController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .controller('msgController', ['$scope','auth','$rootScope','$state','user','$sanitize','inbox','msub', msgController]);
})();
/**
 * Created by Aditech on 2/15/2016.
 */
(function(){
    'use strict';

    var sentController = function ($scope,auth,$rootScope,inbox,$state){
        $scope.isLoggedIn = auth.isLoggedIn;
        inbox.getSentMsgs()
            .then(function(response){
                if(response.data.noMessages){
                    $scope.unread = '0';
                    $scope.newmsg = '0';
                    $scope.allmsg = '0';
                }else{
                    $scope.unread = response.data.msgCount;
                    $scope.newmsg = '1';
                    $scope.msg = response.data.result;
                }
            });
        $scope.MsgBody = function(id,sender){
            angular.forEach($scope.msg, function(value, key){
                if(value.id === id){
                    $rootScope.$broadcast('new-message-body',{mbody:value});
                    $state.go('pm.mbody', {msgid:id});
                    return false;
                }

            });

        };
    };

    angular.module('sentmsg', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('pm.sent', {
                    url: '/sent' ,
                    templateUrl: 'partials/logged/message/sent.html',
                    controller: 'sentController'
                });
        }])
        .controller('sentController', ['$scope','auth','$rootScope','inbox','$state', sentController]);
})();
/**
 * Created by Aditech on 2/15/2016.
 */
(function(){
    'use strict';

    var receivedController = function ($scope,auth,inbox,$rootScope,$state){
        $scope.isLoggedIn = auth.isLoggedIn;
        inbox.getReceivedMsgs().then(function(res){
            if(res.data.noMessages){
                $scope.unread = '0';
                $scope.newmsg = '0';
                $scope.allmsg = '0';
            }else{
                $scope.unread = res.data.msgCount;
                $scope.newmsg = '1';
                $scope.msg = res.data.result;
            }
            $rootScope.$broadcast('new-message-check',{unreadcnt:$scope.unread});
        });

        $scope.MsgBody = function(id,sender){
            inbox.markasRead(id,sender)
                .then(function(res){
                    if(res.data.numark){
                        $rootScope.$broadcast('mark-as-read');
                    }
                });
            angular.forEach($scope.msg, function(value, key){
                if(value.id === id){
                    $rootScope.$broadcast('new-message-body',{mbody:value});
                    $state.go('pm.mbody', {msgid:id});
                    return false;
                }

            });

        };

    };

    angular.module('received', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('pm.received', {
                    url: '/received' ,
                    templateUrl: 'partials/logged/message/received.html',
                    controller: 'receivedController'
                });
        }])
        .controller('receivedController', ['$scope','auth','inbox','$rootScope','$state', receivedController]);
})();
/**
 * Created by Aditech on 2/15/2016.
 */
(function(){
    'use strict';

    var mbodyController = function ($scope,auth,$stateParams,inbox,$state){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.rloading = false;
        ////GET MESSEGE AND ITS REPLIES
        inbox.getMessageBody($stateParams.msgid).success(function(data){
            $scope.id = data.id;
            $scope.message = data.message;
            $scope.sender = data.sender;
            $scope.receiver = data.receiver;
            $scope.senttime = data.senttime;
            $scope.subject = data.subject;
            $scope.sdelete = data.sdelete;
            $scope.rdelete = data.rdelete;
            $scope.parent = data.parent;
            $scope.hasreplies = data.hasreplies;
            $scope.s_unseen = data.s_unseen;
            $scope.r_unseen = data.r_unseen;
            $scope.replies = data.replies;
            if($scope.receiver !== $scope.luname && $scope.sender !== $scope.luname){
                $state.go('pm.received');
            }
        }).error(function () {
            $scope.noMessages = true;
            $state.go('pm.received');
        });
        $scope.$on('new-message-body', function (evt, data) {
            $scope.bmsg = data.mbody;
        });
        //RELY TO MAIN MESSAGE
        $scope.ReplyMsg = function(msg){
            inbox.replymsg($scope.sender,msg,$stateParams.msgid)
                .then(function(response){
                    if(response.data.isError){
                        swal("", response.data.msg, "warning");
                    }else{
                        $scope.replies.push(response.data);
                        $('#replytext').val('');
                    }
                });

        };
        //DELETE REPLIES
        $scope.deleteReply = function(id,index){
            swal({
                    title: "Are you sure?",
                    text: "Are you sure you want to remove message?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Remove",
                    closeOnConfirm: false
                },
                function(){
                    inbox.deletereply(id).success(function(){
                        $scope.replies.splice(index , 1);
                        swal('','You\'ve successfully removed this reply','success');
                    });
                });
        };
        //DELETE MESSAGE
        $scope.deleteMessage = function(){
            swal({
                    title: "Are you sure?",
                    text: "Are you sure you want to remove message and its replies?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Remove",
                    closeOnConfirm: false
                },
                function(){
                    inbox.deletemessage($scope.id,$scope.sender).success(function(){
                        swal('','You\'ve successfully removed this message and its replies','success');
                        $state.go('pm.received');
                    });
                });
        };
    };

    angular.module('onemsg', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('pm.mbody', {
                    url: '/mbody/:msgid' ,
                    templateUrl: 'partials/logged/message/oneMsg.html',
                    controller: 'mbodyController'
                });
        }])
        .controller('mbodyController', ['$scope','auth','$stateParams','inbox','$state', mbodyController]);
})();
/**
 * Created by Aditech on 2/15/2016.
 */
(function(){
    'use strict';

    var notificationsController = function ($scope,auth,inbox){
        $scope.isLoggedIn = auth.isLoggedIn;
        //inbox.getallNotifications()
        //    .then(function(response){
        //        if(response.data.notifications){
        //            $scope.notifications = true;
        //            $scope.notes = response.data.notes;
        //        }else{
        //            $scope.notifications = false;
        //        }
        //    });
    };

    angular.module('notifications', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('pm.notifications', {
                    url: '/notifications' ,
                    templateUrl: 'partials/logged/message/notif.html',
                    controller: 'notificationsController'
                });
        }])
        .controller('notificationsController', ['$scope','auth','inbox', notificationsController]);
})();
/**
 * Created by Aditech on 1/23/2016.
 */
(function(){
    //SETTINGS CONTROLLER
    var settingsController = function ($scope,auth,$rootScope,$state,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        auth.allInfo().success(function(data){if(!data.completeprofile){$state.go('comprofile.pInfo');}
        else{
            $scope.luname = data.username;
            $scope.lavatar = data.avatar;
        }});
        msub.sideNav($scope);

    };
    'use strict';

    angular.module('settings', ['cavatar','cbasic','cpass','cschinfo'])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('settings', {
                    url: '/settings',
                    templateUrl: 'partials/logged/settings/settings.html',
                    controller: 'settingsController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .controller('settingsController', ['$scope','auth','$rootScope','$state','msub', settingsController]);
})();
/**
 * Created by Aditech on 2/16/2016.
 */
(function(){
    'use strict';

    var cavatarController = function ($scope,auth){
        $scope.isLoggedIn = auth.isLoggedIn;
    };

    var AdvancedMarkupCtrl = function ($scope,auth,$state) {
        var button = $('.upload-avatar');
        $scope.uploaded = false;
        var interval;
        // Valid mimetypes
        $scope.acceptTypes = 'image/jpeg,image/png,image/gif';
        // Data to be sent to the server with the upload request
        $scope.uploadData = {
            myformdata: 'hello world'
        };
        $scope.onUpload = function (files) {
            // change button text, when user selects file
            button.text('Uploading');
            // Uploading -> Uploading. -> Uploading...
            interval = window.setInterval(function(){
                var text = button.text();
                if (text.length < 13){
                    button.text(text + '.');
                } else {
                    button.text('Uploading');
                }
            }, 200);
        };

        $scope.onError = function (response) {
            button.text('Change profile picture');
            window.clearInterval(interval);
            $scope.responseData = response.data;
        };

        $scope.onComplete = function (response) {
            window.clearInterval(interval);
            button.text('Change profile picture');
            $scope.filename = response.data.file;
            $scope.obj = {};
            $scope.obj.src = "uploads/"+$scope.filename;
            //[x, y, x2, y2, w, h]
            $scope.obj.selection = [76, 3, 523, 450, 447, 447];
            $scope.obj.thumbnail = true;
            $scope.uploaded = true;
            $('#crop-section').show();
            $('#uploader-section').hide();
        };
        $scope.isProcessing = false;
        $scope.loading = false;
        $scope.SaveCrop = function () {
            $scope.isProcessing = true;
            $scope.loading = true;
            auth.saveCrop($scope.obj.selection,$scope.filename).success(function (data) {
                $scope.user =JSON.parse(localStorage['user-t']);
                $scope.user.avatar = data.image;
                localStorage.setItem('user-t', JSON.stringify($scope.user));
                $state.go('u', {username: $scope.luname});
                var avatar = $(".avatar");
                avatar.attr('src', '/user/'+$scope.luname+'/'+data.image);
                avatar.addClass('avatar');
                $scope.isProcessing = false;
                $scope.loading = false;
            }).error(function () {
                $scope.isProcessing = false;
                $scope.loading = false;
            });
            console.info($scope.obj.selection);
            $scope.uploaded = false;
        };
    };
    angular.module('cavatar', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('settings.avatar', {
                    url: '/avatar' ,
                    templateUrl: 'partials/logged/settings/avatar/avatar.html',
                    controller: 'cavatarController'
                });
        }])
        .config(function(ngJcropConfigProvider){
            ngJcropConfigProvider.setJcropConfig('upload', {
                bgColor: 'black',
                bgOpacity: .4,
                aspectRatio: 1,
                maxWidth: 600,
                maxHeight: 450
            });
        })
        .controller('cavatarController', ['$scope','auth', cavatarController])
        .controller('AppCtrl', ['$scope' , function ($scope) {
            // App variable to show the uploaded response
            $scope.responseData = undefined;
        }])
        .controller('AdvancedMarkupCtrl',['$scope','auth','$state', AdvancedMarkupCtrl]);
})();
/**
 * Created by Aditech on 2/16/2016.
 */
(function(){
    'use strict';

    var basicController = function ($scope,auth,$state){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.loading = false;
        $scope.isProcessing = false;
        auth.allInfo().success(function(data){if(!data.completeprofile){$state.go('comprofile.pInfo');}
        else{
            $scope.luname = data.username;
            $scope.lfname = data.firstname;
            $scope.llname = data.lastname;
            $scope.lcontact = data.contact;
            $scope.lweb = data.website;
            $scope.lbio = data.bio;
            $scope.g = data.gender;
            data.gender === 'f' ? $scope.gender = 'Female' : $scope.gender = 'Male';
        }});
        //SUBMIT FORM
        $scope.SubmitPform = function (gender) {
            $scope.loading = true;
            $scope.isProcessing = true;
            if($("#firstname").val() === ""){
                $scope.successFunc("Firstname required","warning");
            }
            if($("#lastname").val() === ""){
                $scope.successFunc("Lastname required","warning");
            }
            if(gender === "" || gender === undefined){
                gender = $scope.g;
            }
            var user = {
                firstname: $("#firstname").val(),
                lastname: $("#lastname").val(),
                contact: $("#contact").val(),
                website: $("#website").val(),
                bio: $("#bio").val(),
                gender: gender
            };
            console.log(user);
            auth.pInfo(user).success(function (data) {
                $scope.successFunc("You've successfully updated your personal info","success");
            }).error(function (data) {
                $scope.lfname = data.firstname;
                $scope.llname = data.lastname;
                $scope.lcontact = data.contact;
                $scope.lweb = data.website;
                $scope.lbio = data.bio;
                $scope.successFunc(data.message,"error");
            });
            $scope.successFunc = function (msg,type) {
                $scope.loading = false;
                $scope.isProcessing = false;
                swal("",msg,type);
                return false;
            };
        };
        $scope.SubmitPform1 = function (lfname,llname,lcontact,lweb,lbio,g) {
            $scope.loading = true;
            $scope.isProcessing = true;
            if(lfname === "" || lfname === undefined){
                $scope.successFunc("Firstname required","warning");
            }
            if(llname === "" || llname === undefined){
                $scope.successFunc("Lastname required","warning");
            }
            if(g === "" || g === undefined){
                g = $scope.g;
            }
            var user = {
                firstname: lfname,
                lastname: llname,
                contact: lcontact,
                website: lweb,
                bio: lbio,
                gender: g
            };
            console.log(user);
            auth.pInfo(user).success(function (data) {
                $scope.successFunc("You've successfully updated your personal info","success");
            }).error(function (data) {
                $scope.lfname = data.firstname;
                $scope.llname = data.lastname;
                $scope.lcontact = data.contact;
                $scope.lweb = data.website;
                $scope.lbio = data.bio;
                $scope.successFunc(data.message,"error");
            });
            $scope.successFunc = function (msg,type) {
                $scope.loading = false;
                $scope.isProcessing = false;
                swal("",msg,type);
                return false;
            };
        };
    };

    angular.module('cbasic', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('settings.basic', {
                    url: '/settings' ,
                    templateUrl: 'partials/logged/settings/basicInfo/basicInfo.html',
                    controller: 'basicController'
                });
        }])
        .controller('basicController', ['$scope','auth','$state', basicController]);
})();
/**
 * Created by Aditech on 2/16/2016.
 */
(function(){
    'use strict';

    var passController = function ($scope,auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.passloading = false;
        $scope.isProcessing = false;
        $scope.ChangePass = function(pass){
            $scope.passloading = true;
            $scope.isProcessing = true;
            auth.changePass(pass).success(function(){
                $scope.finishFunc("Password was changed successfully","success");
            }).error(function (data) {
                $scope.finishFunc(data.message,"error");
            });
            $scope.finishFunc = function (msg,type) {
                $scope.passloading = false;
                $scope.isProcessing = false;
                swal('',msg,type);
                $("#oldpass").val("");
                $("#newpass1").val("");
                $("#newpass2").val("");
            }
        };
    };

    angular.module('cpass', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('settings.pass', {
                    url: '/pass' ,
                    templateUrl: 'partials/logged/settings/cpass.html',
                    controller: 'passController'
                });
        }])
        .controller('passController', ['$scope','auth', passController]);
})();
/**
 * Created by Aditech on 2/16/2016.
 */
(function(){
    'use strict';

    var cschController = function ($scope,auth,user,msub){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.goNext = false;
        $scope.isStudent = false;
        $scope.isStudentOfUg = true;
        $scope.isProcessing = false;
        $scope.selection = [];
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.depts = user.getAllDepts($scope);
        $scope.halls = user.getAllHalls($scope);

        $scope.NotStudent = function () {
            $scope.schoolInfo = {status: false};
            $scope.saveSubmission($scope.schoolInfo);
        };

        $scope.StudentofUg = function(){
            $scope.isStudent = true;
            $scope.isStudentOfUg = true;
        };

        $scope.NotStudentofUg = function(){
            $scope.isStudent = true;
            $scope.isStudentOfUg = false;
        };

        $scope.SubmitNotUgStudent = function(sch){
            $scope.sch = (sch === "" || sch === undefined) ? 'null' : sch;
            $scope.schoolInfo = {status: true, ug: false, name: $scope.sch};
            $scope.saveSubmission($scope.schoolInfo);
        };

        $scope.toggleSelection = function(dept) {
            var idx = $scope.selection.indexOf(dept);
            if(idx > -1){$scope.selection.splice(idx, 1);}else{$scope.selection.push(dept);}
            $scope.selectionId = [];
            angular.forEach($scope.selection, function(value){
                $scope.selectionId.push(value._id);
            });
        };
        $scope.$on('dept-info', function (evt , val) {
            $scope.selection = val.selection;
            $scope.selectionId = val.selectionId;
        });

        $scope.SubmitUgStudent = function (sub,t) {
            console.info(sub);
            if(sub  === undefined || sub.hall === undefined || sub.hall === ""){
                swal("", "Hall not selected", "warning");
            }else if(sub  === undefined || sub.level === undefined || sub.level === ""){
                swal("", "Level not selected", "warning");
            }else if($scope.selection < 1){
                swal("", "Department not selected", "warning");
            }else{
                if(t === 'desktop'){
                    $scope.hId = sub.hall._id
                }else if(t === 'mobile'){
                    $scope.hId = JSON.parse(sub.hall)._id;
                }
                $scope.schoolInfo = {status: true, ug: true, name: "University of Ghana",level:sub.level,hall:$scope.hId,department:$scope.selectionId};
                $scope.saveSubmission($scope.schoolInfo);
            }
        };
        $scope.saveSubmission = function (data) {
            $scope.isProcessing = true;
            $scope.sloading = true;
            auth.SchInfo(data).success(function () {
                $scope.successFunc("You've successfully updated your school info","success");
                $scope.$broadcast('userprofile-credentials');
            }).error(function (data) {
                $scope.successFunc(data.message,"error");
            });
            $scope.successFunc = function (msg,type) {
                $scope.sloading = false;
                $scope.isProcessing = false;
                swal("",msg,type);
                return false;
            };
        };
        $scope.showDeptDialog = function (ev) {
            msub.fulldialog(ev,'deptCtrl','partials/templates/mobile/dept.mob.html');
        };
    };

    angular.module('cschinfo', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('settings.sch', {
                    url: '/sch' ,
                    templateUrl: 'partials/logged/settings/schInfo/schinfo.html',
                    controller: 'cschController'
                });
        }])
        .controller('cschController', ['$scope','auth','user','msub', cschController]);
})();
/**
 * Created by Aditech on 4/19/2016.
 */
(function(){
    //ADMIN CONTROLLER
    var adminController = function ($scope,auth,$state,$rootScope,user){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.pageSize = 5;
        $scope.currentPage = 1;
        $scope.allusers = [];
        $scope.allusers.members = {};
        $rootScope.$broadcast('complete-process',{completeprocess: false});
        auth.allInfo().success(function(data){if(!data.completeprofile){$state.go('comprofile.pInfo');}
        else{
            $scope.luname = data.username;
            $scope.lavatar = data.avatar;
        }});
        auth.getAllMembers().success(function (data) {
            $scope.allusers = data;

        }).error(function () {
            $state.go('homepage');
        });

        auth.getSuggestions().success(function (data) {
            $scope.suggestions = data
        });

        //GET ALL USERS
        $scope.p = {};
        user.getallUsers().success(function (data) {$scope.p.options = data;});
        //ADD AN ADMIN
        $scope.AddAdmin = function (admin) {
            swal({
                    title: "",
                    text: "Are you sure you want to add "+ admin.username + " as an admin",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Yes",
                    closeOnConfirm: false
                },
                function(){
                    user.addadmin(admin.username).success(function (data) {
                        swal('','admin was added successfully','success');
                        angular.forEach($scope.allusers.members, function(value){
                            if(admin.username === value.username){
                                value.level = 'd';
                            }
                        })
                    }).error(function (data) {
                        swal('',data.message,'error');
                    });
                });
        };
        //REMOVE ADMIN
        $scope.RemoveAdmin = function (id,u) {
            swal({
                    title: "",
                    text: "Are you sure you want to remove "+ u +" as an admin",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Yes",
                    closeOnConfirm: false
                },
                function(){
                    user.removeadmin(id).success(function (data) {
                        swal('','admin was removed successfully','success');
                        angular.forEach($scope.allusers.members, function(value){
                            if(id === value.id){
                                value.level = 'a';
                            }
                        })
                    }).error(function (data) {
                        swal('',data.message,'error');
                    });
                })
        };
        //EDIT MEMBERS
        $scope.EditMe = function (us) {
            $scope.us = us;
        };
        $scope.EditMember = function (id,u) {
            swal({
                    title: "",
                    text: "Are you sure you want to edit "+ u,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Yes",
                    closeOnConfirm: false
                },
                function(){
                    user.addadmin(admin.username).success(function (data) {
                        swal('','admin was added successfully','success');
                        angular.forEach($scope.allusers, function(value){
                            if(admin.username === value.username){
                                value.level = 'd';
                            }
                        })
                    }).error(function (data) {
                        swal('',data.message,'error');
                    });
                })
        };
        //DELETE MEMBERS
        $scope.DeleteMember = function (id,u,index) {
            swal({
                    title: "",
                    text: "Are you sure you want to delete "+ u,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-sm btn-success",
                    cancelButtonClass: "btn-sm btn-danger",
                    confirmButtonText: "Yes",
                    closeOnConfirm: false
                },
                function(){
                    user.deleteuser(id).success(function () {
                        swal('','This user was removed successfully','success');
                        $scope.allusers.members.splice(index, 1);
                    }).error(function (data) {
                        swal('',data.message,'error');
                    });
                })
        };
    };
    'use strict';

    angular.module('admin', [])
        .config(['$stateProvider',function ($stateProvider) {
            $stateProvider
                .state('admin', {
                    url: '/admin' ,
                    templateUrl: 'partials/logged/admin/admin.html',
                    controller: 'adminController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(!auth.isLoggedIn()){
                            $state.go('login');
                        }
                    }]
                });
        }])
        .controller('adminController', ['$scope','auth','$state','$rootScope','user', adminController]);
})();
/**
 * Created by Aditech on 1/12/2016.
 */
(function(){
    'use strict';
    function AuthService($http, $window,$localStorage){
        var auth = {};

        //save token
        auth.saveToken = function (token){
            $localStorage.w_token = token;
        };

        //save user info
        auth.saveUser = function (user) {
            $localStorage.user_t = user;
        };

        //get token
        auth.getToken = function (){
            return $localStorage.w_token;
        };

        //check if userprofile is logged in.
        auth.isLoggedIn = function(){
            var token = auth.getToken();
            if(token){
                var payload = JSON.parse($window.atob(token.split('.')[1]));
                return payload.exp > Date.now() / 1000;
            } else {
                return false;
            }
        };

        //get current user
        auth.currentUser = function(){
            if(auth.isLoggedIn()){
                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));
                return {
                    username:  payload.username,
                    email: payload.email,
                    avatar: payload.avatar,
                    id: payload._id
                };
            }
        };

        //save token for registered userprofile
        auth.register = function(user){
            return $http.post('/auth/register', user).success(function(data){
                auth.saveToken(data.token);
                auth.saveUser(JSON.stringify(data.user));
            });
        };
        //userprofile forgot password
        auth.forgetPass = function (user) {
            return $http.post('/auth/forgetPass', user);
        };
        //userprofile resend activation
        auth.resendActivation = function (user) {
            return $http.post('/auth/resendActivation', user);
        };
        //save token for logged in userprofile
        auth.logIn = function(user){
            return $http.post('/auth/login', user).success(function(data){
                auth.saveToken(data.token);
                auth.saveUser(JSON.stringify(data.user));

            });
        };
        //logout function to remove userprofile token
        auth.logOut = function(){
            return $http.get('/validate/logout/'+auth.currentUser().username).success(function(){
                $window.localStorage.removeItem('schInfo');
                $window.localStorage.removeItem('frInfo');
                $window.localStorage.removeItem('pInfo');
                $window.localStorage.removeItem('avaInfo');
                delete $localStorage.w_token;
                delete $localStorage.user_t;
            });
        };
        auth.saveCrop = function (selection,image) {
            return $http.post('/api/saveCrop',{selection:selection,image:image,user:auth.currentUser().username})
        };
        //get all userprofile info
        auth.allInfo = function () {
            return $http.get('/api/userInfo/'+auth.currentUser().username);
        };
        auth.changePass = function(pass){
            return $http.post('/validate/changePass',{pass:pass,user:auth.currentUser().username})
        };
        auth.pInfo = function (u) {
            return $http.post('/validate/pInfo',{u:u,user:auth.currentUser().username});
        };
        auth.SchInfo = function (sch) {
            return $http.post('/validate/SchInfo',{sch:sch,user:auth.currentUser().username})
        };
        //
        auth.getAllMembers = function () {
            return $http.get('/api/getAllMembers/'+auth.currentUser().username);
        };
        auth.savesuggestions = function (uname,msg,u) {
            return $http.post('/auth/savesuggestions',{uname:uname,msg:msg,user:u});
        };
        auth.getSuggestions = function () {
            return $http.get('/api/getSuggestions/'+auth.currentUser().username);
        };
        return auth;
    }

    angular.module('wontApp')
        .factory('auth', ['$http','$window','$localStorage', AuthService]);
}());
/**
 * Created by Aditech on 1/16/2016.
 */
(function(){
    'use strict';
    function UserService($http,auth){
        var user = {};
        //get all Depts
        user.getAllDepts = function ($scope) {
            $http.get('/api/getAllDepts').success(function(data){
                $scope.depts = data;
                //$scope.dloading = false;
                return $scope.depts;
            });
        };
        user.getAlldpts = function(){
            return $http.get('/api/getAllDepts');
        };
        //get all Halls
        user.getAllHalls = function ($scope) {
            $http.get('/api/getAllHalls').success(function(data){
                $scope.halls = data;
                return $scope.halls;
            });
        };
        user.getAllhlls = function(){
            return $http.get('/api/getAllHalls');
        };
        //get suggested Friends
        user.getSugFrnds = function(sch){
            return $http.get('/api/getSugFrnds/'+sch+'/'+auth.currentUser().username);
        };
        //
        user.saveInfo = function (sch, per, frs, ava) {
            return $http.post('/api/completeProfle', {sch: sch, per: per, frs: frs , ava: ava , user: auth.currentUser().username});
        };
        //get all userprofile info
        user.profileInfo = function (user) {
            return $http.get('/api/getProfileInfo/'+user+'/'+auth.currentUser().username);
        };
        //
        user.getallUsers = function () {
            return $http.get('/api/getAllUsers');
        };
        //
        user.addfriend = function (user) {
            return $http.post('/api/addfriend',{username: user,logUser: auth.currentUser().username});
        };
        user.unfriend = function (user) {
            return $http.post('/api/unfriend',{username: user,logUser: auth.currentUser().username});
        };
        user.blockuser = function (user) {
            return $http.post('/api/blockuser',{username: user,logUser: auth.currentUser().username});
        };
        user.unblockuser = function (user) {
            return $http.post('/api/unblockuser',{username: user,logUser: auth.currentUser().username});
        };
        //
        user.getRequests = function () {
            return $http.get('/api/getRequests/'+auth.currentUser().username);
        };
        user.getNofications = function () {
            return $http.get('/api/getNofications/'+auth.currentUser().username);
        };
        user.checkpm = function () {
            return $http.get('/api/checkpm/'+auth.currentUser().username);
        };
        //
        user.accept = function (user) {
            return $http.post('/api/acceptRequest',{username: user,logUser: auth.currentUser().username});
        };
        user.ignore = function (user) {
            return $http.post('/api/ignoreRequest',{username: user,logUser: auth.currentUser().username});
        };
        //
        user.getFriends = function (user,limit,scope) {
            $http.get('/api/getfriends/onlyFriends/'+user+'/'+limit).success(function (data) {
                scope.friends = data;
                return scope.friends;
            }).error(function (data) {
                scope.friends = data;
                return scope.friends;
            });
        };
        user.getFrFrnds = function (limit) {
            return $http.get('/api/getfriends/frFriends/'+auth.currentUser().username+'/'+limit);
        };
        user.getFrOnline = function (limit) {
            return $http.get('/api/getfriends/FrOnline/'+auth.currentUser().username+'/'+limit);
        };
        //
        user.markAllAsRead = function () {
            return $http.post('/api/markAllAsRead', {user:auth.currentUser().username});
        };
        user.MarkasRead = function(id){
            return $http.post('/api/MarkasRead', {id:id});
        };
        user.updateCheck = function(){
            return $http.post('/api/updateCheck', {user:auth.currentUser().username});
        };
        //
        user.saveTransition = function(type){
            return $http.post('/api/saveTransition', {type:type,user:auth.currentUser().username});
        };
        user.saveCoverImgs = function (images) {
            return $http.post('/api/saveCoverImgs', {images:images,user:auth.currentUser().username});
        };
        user.saveCImgs = function (images) {
            return $http.post('/api/saveCImgs', {images:images,user:auth.currentUser().username});
        };
        user.removeimage = function (image) {
            return $http.post('/api/removeimage', {image:image,user:auth.currentUser().username});
        };
        //
        user.addadmin = function (username) {
            return $http.post('/api/addadmin', {username:username,user:auth.currentUser().username});
        };
        user.removeadmin = function (id) {
            return $http.post('/api/removeadmin', {id:id,user:auth.currentUser().username});
        };
        user.deleteuser = function (id) {
            return $http.post('/api/deleteuser', {id:id,user:auth.currentUser().username});
        };
        return user;
    }
    angular.module('wontApp')
        .factory('user', ['$http','auth', UserService]);
}());
/**
 * Created by Aditech on 1/27/2016.
 */
(function(){
    'use strict';
    function SubService($http, $window,auth){
        var sub = {};
        sub.makePost = function (post,taah) {
            return $http.post('/subApi/submitSub', {type:"text",post: post,taah:taah,user:auth.currentUser().username});
        };
        sub.newLink = function (post,taah) {
            return $http.post('/subApi/submitSub', {type:"link",post: post,taah:taah,user:auth.currentUser().username});
        };
        sub.replymsub = function (post,id){
            return $http.post('/subApi/submitReply', {type:"mrep",post: post,id:id,chid:id,user:auth.currentUser().username});
        };
        sub.replyssub = function (post,id,chid) {
            return $http.post('/subApi/submitReply', {type:"srep",post: post,id:id,chid:chid,user:auth.currentUser().username});
        };
        //
        sub.upvote = function(id){
            return $http.post('/subApi/vote', {type:"up",id:id,user:auth.currentUser().username});
        };
        sub.downvote = function(id){
            return $http.post('/subApi/vote', {type:"down",id:id,user:auth.currentUser().username});
        };
        sub.removesub = function(id){
            return $http.post('/subApi/remove', {type:"sub",id:id,user:auth.currentUser().username});
        };
        sub.savedSub = function(id){
            return $http.post('/subApi/savestatus', {type:"save",id:id,user:auth.currentUser().username});
        };
        sub.unsaveSub = function(id){
            return $http.post('/subApi/savestatus', {type:"unsave",id:id,user:auth.currentUser().username});
        };
        //
        sub.getcomments = function(id){
            return $http.get('/subApi/getcomments/'+id+'/'+auth.currentUser().username);
        };
        sub.getUserTaahs = function () {
            return $http.get('/subApi/getutaahs/'+auth.currentUser().username);
        };
        //
        sub.getAllHot = function (limit) {
            return $http.get('/subApi/getsubmissions/getAllHot/'+limit+'/'+auth.currentUser().username+'/v/name');
        };
        sub.getAllNew = function (limit) {
            return $http.get('/subApi/getsubmissions/getAllNew/'+limit+'/'+auth.currentUser().username+'/v/name');
        };
        sub.getAllCon = function (limit,v) {
            return $http.get('/subApi/getsubmissions/getAllCon/'+limit+'/'+auth.currentUser().username+'/'+v+'/name');
        };
        sub.getAllTop = function (limit,v) {
            return $http.get('/subApi/getsubmissions/getAllTop/'+limit+'/'+auth.currentUser().username+'/'+v+'/name');
        };

        sub.getTaahHot = function (limit,name) {
            return $http.get('/subApi/getsubmissions/getTaahHot/'+limit+'/'+auth.currentUser().username+'/v/'+name);
        };
        sub.getTaahNew = function (limit,name) {
            return $http.get('/subApi/getsubmissions/getTaahNew/'+limit+'/'+auth.currentUser().username+'/v/'+name);
        };
        sub.getTaahCon = function (limit,v,name) {
            return $http.get('/subApi/getsubmissions/getTaahCon/'+limit+'/'+auth.currentUser().username+'/'+v+'/'+name);
        };
        sub.getTaahTop = function (limit,v,name) {
            return $http.get('/subApi/getsubmissions/getTaahTop/'+limit+'/'+auth.currentUser().username+'/'+v+'/'+name);
        };

        sub.getUserHot = function (limit,name) {
            return $http.get('/subApi/getsubmissions/getUserHot/'+limit+'/'+auth.currentUser().username+'/v/'+name);
        };
        sub.getUserNew = function (limit,name) {
            return $http.get('/subApi/getsubmissions/getUserNew/'+limit+'/'+auth.currentUser().username+'/v/'+name);
        };
        sub.getUserCon = function (limit,v,name) {
            return $http.get('/subApi/getsubmissions/getUserCon/'+limit+'/'+auth.currentUser().username+'/'+v+'/'+name);
        };
        sub.getUserTop = function (limit,v,name) {
            return $http.get('/subApi/getsubmissions/getUserTop/'+limit+'/'+auth.currentUser().username+'/'+v+'/'+name);
        };
        sub.getUserSaved = function (limit,name) {
            return $http.get('/subApi/getsubmissions/getUserSaved/'+limit+'/'+auth.currentUser().username+'/v/'+name);
        };
        //
        sub.getSubmission = function (id) {
            return $http.get('/subApi/getSubmission/'+id+'/'+auth.currentUser().username);
        };
        return sub;
    }
    angular.module('wontApp')
        .factory('sub', ['$http','$window','auth', SubService]);
}());
/**
 * Created by Aditech on 2/1/2016.
 */
(function(){
    'use strict';
    function mSubService(auth,$mdDialog,$mdMedia,$mdSidenav,$log){
        var msub = {};
        msub.subAlt = function($scope,vote,postedtimes){
            //FILTERS
            $scope.postedtimes = postedtimes.postedtimesquery();
            $scope.postedtime = $scope.postedtimes[0];
            $scope.postedtime2 = $scope.postedtimes[0];
            //REMOVE SUBMISSION
            $scope.removepost = function(id,index,t){
                swal({
                        title: "Are you sure?",
                        text: "You will completely remove this submission and all of its comments",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonClass: "btn-sm btn-success",
                        cancelButtonClass: "btn-sm btn-danger",
                        confirmButtonText: "Remove",
                        closeOnConfirm: false
                    },
                    function(){
                        vote.remove(id,index,t,$scope.hot,$scope.new,$scope.con,$scope.top,$scope.ussubs = '');
                    });
            };
            //UP VOTE
            $scope.upVotePost = function(id,index,t){
                vote.upvotes(id,index,t,$scope.hot,$scope.new,$scope.con,$scope.top,$scope.ussubs = '');
            };
            //DOWN VOTE
            $scope.downVotePost = function(id,index,t){
                vote.downvotes(id,index,t,$scope.hot,$scope.new,$scope.con,$scope.top,$scope.ussubs = '');
            };
            //SAVE POST
            $scope.SavePost = function(id,t){
                vote.save(id,t,$scope.hot,$scope.new,$scope.con,$scope.top,$scope.ussubs = '');
            };
            //UNSAVE POST
            $scope.unSavePost = function(id,t){
                vote.unsave(id,t,$scope.hot,$scope.new,$scope.con,$scope.top,$scope.ussubs = '');
            };
            //HIDE POST
            $scope.HidePost = function(id,t){
                vote.hide(id,t);
            };
        };

        msub.LogUserInfo = function ($scope) {
            auth.allInfo()
                .success(function (data) {
                    $scope.admin = false;
                    $scope.id = data._id;
                    $scope.luname = data.username;
                    $scope.lavatar = data.avatar;
                    $scope.lemail = data.email;
                    $scope.userlevel = data.userlevel;
                    $scope.lstatus = data.school.status;
                    $scope.sug = data.school.ug;
                    if (data.school.status) {
                        $scope.lug = data.school.ug;
                    }
                    if(data.userlevel === 'd'){
                        $scope.admin = true;
                    }
                }).error(function (data) {
            });
        };

        msub.statusVariables = function ($scope,limit,load,type) {
            $scope.limit = limit;
            $scope.load = load;
            $scope.type = type;
        };

        msub.successfunc = function ($scope,type,data) {
            angular.forEach(data.data, function (value) {
                if($scope.mobile){
                    var m = value.postdate.split(' '),t='';
                    if(m[1] === 'second' || m[1] === 'seconds'){
                        t = 's';
                    }else if (m[1] === 'minute' || m[1] === 'minutes'){
                        t = 'min';
                    }else if (m[1] === 'hour' || m[1] === 'hours'){
                        t = 'h';
                    }else if (m[1] === 'day' || m[1] === 'days'){
                        t = 'd';
                    }else if (m[1] === 'week' || m[1] === 'weeks'){
                        t = 'w';
                    }else if (m[1] === 'month' || m[1] === 'months'){
                        t = 'mon';
                    }else if (m[1] === 'year' || m[1] === 'year'){
                        t = 'y';
                    }
                    value.postdate = m[0]+""+t;
                }
            });
            if(type === "h"){
                $scope.ho = data.data;
                $scope.hot = $scope.ho.sort(function(a,b) {return (a.score < b.score) ? 1 : ((b.score < a.score) ? -1 : 0);} );
            }else if(type === "c"){
                $scope.co = data.data;
                $scope.con = $scope.co.sort(function(a,b) {return (a.cont < b.cont) ? 1 : ((b.cont < a.cont) ? -1 : 0);} );
            }else if(type === "n"){
                $scope.new = data.data;
                //$scope.new = $scope.ne.sort(function(a,b) {return (a.postdate > b.postdate) ? 1 : ((b.postdate > a.postdate) ? -1 : 0);} );
            }else if(type === "t"){
                $scope.to = data.data;
                $scope.top = $scope.to.sort(function(a,b) {return (a.diff < b.diff) ? 1 : ((b.diff < a.diff) ? -1 : 0);} );
            }else if(type === "s"){
                $scope.save = data.data;
            }
            $scope.type = data.data;
            $scope.limit = data.limit;
            $scope.isError = data.isError;
            $scope.size = data.size;
            $scope.load = false;
            $scope.mload = false;
        };

        msub.errorfunc = function ($scope, data) {
            $scope.message = data;
            $scope.isError = data.isError;
            $scope.load = false;
            $scope.mload = false;
        };

        msub.fulldialog = function (ev,ctrl,url) {
            //MOBILE
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && ($mdMedia('xs') || $mdMedia('sm'));
            $mdDialog.show({
                controller: ctrl,
                templateUrl: url,
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: useFullScreen
            });
        };

        msub.scopeOnly = function ($scope) {
            //CANCEL
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
        };
        //TOGGLE RIGHT
        msub.sideNav = function ($scope) {
            $scope.toggleRight = buildToggler('right');
            $scope.isOpenRight = function(){
                return $mdSidenav('right').isOpen();
            };
            function buildToggler(navID) {
                return function() {
                    // Component lookup should always be available since we are not using `ng-if`
                    $mdSidenav(navID)
                        .toggle()
                        .then(function () {
                            $log.debug("toggle " + navID + " is done");
                        });
                }
            }
            $scope.close = function () {
                // Component lookup should always be available since we are not using `ng-if`
                $mdSidenav('right').close()
                    .then(function () {
                        $log.debug("close RIGHT is done");
                    });
            };
        };

        msub.Load = function ($scope,l,p) {
            $scope.loading = l;
            $scope.isProcessing = p;
        };

        return msub;
    }
    angular.module('wontApp')
        .factory('msub', ['auth','$mdDialog','$mdMedia','$mdSidenav','$log', mSubService]);
}());
/**
 * Created by Aditech on 1/31/2016.
 */
(function(){
    'use strict';
    function TaahService($http,auth){
        var taah = {};
        taah.gettaahbyname = function (name) {
            return $http.get('/taahApi/gettaahbyname/'+name+'/'+auth.currentUser().username);
        };
        taah.getAllTaahs = function () {
            return $http.get('/taahApi/getAllTaahs/'+auth.currentUser().username);
        };
        taah.createTaah = function (taah) {
            return $http.post('/taahApi/createTaah', {taah:taah,user:auth.currentUser().username});
        };
        taah.editTaah = function (t,desc,type,cop,id) {
            return $http.post('/taahApi/editTaah', {title:t,desc:desc,type:type,coption:cop,id:id,user:auth.currentUser().username});
        };
        taah.subscribeNow = function (name) {
            return $http.post('/taahApi/subscription', {type:'main',status:"subscribe",name:name,user:auth.currentUser().username});
        };
        taah.MakeSubscribtion = function (name) {
            return $http.post('/taahApi/subscription', {type:'ffriend',status:"subscribe",name:name,user:auth.currentUser().username});
        };
        taah.unsubscribeNow = function (name) {
            return $http.post('/taahApi/subscription', {type:'main',status:"unsubscribe",name:name,user:auth.currentUser().username});
        };
        taah.InviteFrnds = function(frnds,taah){
            return $http.post('/taahApi/InviteFrnds', {frnds:frnds,taah:taah,user:auth.currentUser().username});
        };
        taah.inviteFrnd = function (taahs,frnd) {
            return $http.post('/taahApi/InviteFrnd', {frnd:frnd,taahs:taahs,user:auth.currentUser().username});
        };
        taah.ignoreTaah = function(name){
            return $http.post('/taahApi/ignoreTaahRequest', {taah:name,user:auth.currentUser().username});
        };
        taah.acceptSub = function(name, taah){
            return $http.post('/taahApi/acceptSub', {taah:taah,user:name});
        };
        taah.ignoreSub = function(name, taah){
            return $http.post('/taahApi/ignoreSub', {taah:taah,user:name});
        };
        return taah;
    }
    angular.module('wontApp')
        .factory('taah', ['$http','auth', TaahService]);
}());
(function(){

    function Vote(sub){
        this.upvotes = function(id,index,t,hot,ne,con,top,ss){
            return sub.upvote(id)
                .then(function(response){
                    if(response.data.isSuccess){
                        var i ;
                        if(t === 'h'){
                            i = hot[index];
                        }else if (t === 'n'){
                            i = ne[index];
                        }else if (t === 'c'){
                            i = con[index];
                        }else if (t === 't'){
                            i = top[index];
                        }
                        else if (t === 's'){
                            i = ss[index];
                        }else if (t === 'a'){
                            i = index;
                        }
                        if(i.userVoted === true && i.voteStatus === true){
                            i.up--;
                            i.userVoted = false;
                            i.voteStatus = "";
                        }else if(i.userVoted === false) {
                            i.up++;
                            i.userVoted = true;
                            i.voteStatus = true;
                        } else if(i.voteStatus === false && i.userVoted === true){
                            i.up++;
                            i.down--;
                            i.userVoted = true;
                            i.voteStatus = true;
                        }
                    }else{
                        swal('','unknown error occurred, try again later','error');
                    }
                });
        },
            this.downvotes = function(id,index,t,hot,ne,con,top,ss){
                return sub.downvote(id)
                    .then(function(response){
                        if(response.data.isSuccess){
                            var i ;
                            if(t === 'h'){
                                i = hot[index];
                            }else if (t === 'n'){
                                i = ne[index];
                            }else if (t === 'c'){
                                i = con[index];
                            }else if (t === 't'){
                                i = top[index];
                            }
                            else if (t === 's'){
                                i = ss[index];
                            }else if (t === 'a'){
                                i = index;
                            }
                            if(i.userVoted === true && i.voteStatus === false){
                                i.down--;
                                i.userVoted = false;
                                i.voteStatus = "";
                            }else if(i.userVoted === false) {
                                i.down++;
                                i.voteStatus = false;
                                i.userVoted = true;
                            } else if(i.voteStatus === true && i.userVoted === true){
                                i.up--;
                                i.down++;
                                i.voteStatus = false;
                                i.userVoted = true;
                            }
                        }else{
                            swal('','unknown error occurred, try again later','error');
                        }
                    });
            },
            this.remove = function(id,index,t,hot,ne,con,top,ss){
                return sub.removesub(id)
                    .then(function (response) {
                        if(response.data.isError){
                            swal('',response.data.msg,'warning');
                            return false;
                        }else if(response.data.isSuccess){
                            if(t === 'h'){
                                hot.splice(index, 1);
                            }else if (t === 'n'){
                                ne.splice(index, 1);
                            }else if (t === 'c'){
                                con.splice(index, 1);
                            }else if (t === 't'){
                                top.splice(index, 1);
                            }
                            else if (t === 's'){
                                ss.splice(index, 1);
                            }
                            else if (t === 'a'){
                                hot.splice(index, 1);
                            }
                            swal('',"You've successfully remove the submission",'success');
                        }
                    });
            },
            this.save = function(id,t,hot,ne,con,top,ss){
                sub.savedSub(id)
                    .then(function(response){
                        if(response.data.isSuccess){
                            var i = "";
                            if(t === 'h'){
                                i = hot;
                            }else if (t === 'n'){
                                i = ne;
                            }else if (t === 'c'){
                                i = con;
                            }else if (t === 't'){
                                i = top;
                            }else if (t === 's'){
                                i = ss;
                            }else if (t === 'a'){
                                i = hot.saved = true;
                                return false;
                            } else{
                                i = '';
                            }
                            angular.forEach(i,function(value){
                                if(id === value.id){
                                    value.saved = true;
                                }
                            });
                        }
                    });
            },
            this.unsave = function(id,t,hot,ne,con,top,ss){
                sub.unsaveSub(id)
                    .then(function(response){
                        if(response.data.isSuccess){
                            var i = "";
                            if(t === 'h'){
                                i = hot;
                            }else if (t === 'n'){
                                i = ne;
                            }else if (t === 'c'){
                                i = con;
                            }else if (t === 't'){
                                i = top;
                            }else if (t === 's'){
                                i = ss;
                            }else if (t === 'a'){
                                i = hot.saved = false;
                                return false;
                            }else{
                                i = '';
                            }
                            angular.forEach(i,function(value){
                                if(id === value.id){
                                    value.saved = false;
                                }
                            });
                        }
                    });
            },
            this.hide = function(id,t){
                $('#'+t+'post_'+id).css('display','none');
            };
    };

    'use strict';
    angular.module('wontApp')
        .service('vote', ['sub', Vote]);
})();
/**
 * Created by Aditech on 2/1/2016.
 */
(function(){
    'use strict';
    angular.module('wontApp')
        .service('postedtimes', function(){
            this.postedtimesquery = function(){
                return [
                    {
                        name: 'past 24 hours',
                        value:'24h'
                    },
                    {
                        name: 'past hour',
                        value:'1h'
                    },
                    {
                        name: 'past week',
                        value:'7d'
                    },
                    {
                        name: 'past month',
                        value:'30d'
                    },
                    {
                        name: 'past year',
                        value:'1y'
                    },
                    {
                        name: 'all time',
                        value:'all'
                    }
                ];
            };
        });
})();
(function(){
    'use strict';
    angular.module('wontApp')
        .service('opt', function(){
            this.options = function(){
                return [
                    {
                        name: 'All',
                        value: '1'
                    },
                    {
                        name: 'Department',
                        value: 'Department'
                    },
                    {
                        name: 'Level',
                        value: 'school.level'
                    },
                    {
                        name: 'Hall',
                        value: 'school.hall'
                    },
                    {
                        name: 'Gender',
                        value: 'gender'
                    }
                ];
            },
                this.gender = function () {
                    return [
                        {
                            name:'All',
                            _id:'1'
                        },
                        {
                            name:'Male',
                            _id:'m'
                        },
                        {
                            name:'Female',
                            _id:'f'
                        }
                    ]
                },
                this.lvl = function () {
                    return [
                        {
                            name:'All',
                            _id:'1'
                        },
                        {
                            name:'100',
                            _id:'100'
                        },
                        {
                            name:'200',
                            _id:'200'
                        },
                        {
                            name:'300',
                            _id:'300'
                        },
                        {
                            name:'400',
                            _id:'400'
                        },
                        {
                            name:'500',
                            _id:'500'
                        },
                        {
                            name:'600',
                            _id:'600'
                        }
                    ];
                };
        });
})();
/**
 * Created by Aditech on 2/9/2016.
 */
(function(){
    'use strict';
    function DictService($http,auth){
        var dict = {};
        dict.getAllUgStudents = function () {
            return $http.get('/dictApi/getAllUgStudents');
        };
        dict.FirstFilter = function (id,name) {
            return $http.get('/dictApi/FirstFilter/'+id+'/'+name);
        };
        dict.SecondFilter = function (id1,name1,id2,name2) {
            return $http.get('/dictApi/SecondFilter/'+id1+'/'+name1+'/'+id2+'/'+name2);
        };
        dict.ThirdFilter = function (id1,name1,id2,name2,id3,name3) {
            return $http.get('/dictApi/ThirdFilter/'+id1+'/'+name1+'/'+id2+'/'+name2+'/'+id3+'/'+name3);
        };
        dict.FourthFilter = function (id1,name1,id2,name2,id3,name3,id4,name4) {
            return $http.get('/dictApi/FourthFilter/'+id1+'/'+name1+'/'+id2+'/'+name2+'/'+id3+'/'+name3+'/'+id4+'/'+name4);
        };
        return dict;
    }
    angular.module('wontApp')
        .factory('dict', ['$http','auth', DictService]);
}());
/**
 * Created by Aditech on 2/15/2016.
 */
(function(){
    'use strict';
    function InboxService($http,auth){
        var inbox = {};
        inbox.sendMessage = function (to,title,msg) {
            return $http.post('/inboxApi/sendMessage', {to:to,title:title,msg:msg,user:auth.currentUser().username});
        };
        inbox.markasRead = function (id,sender) {
            return $http.post('/inboxApi/markasRead', {id:id,sender:sender,user:auth.currentUser().username});
        };
        inbox.replymsg = function (sender, msg, id) {
            return $http.post('/inboxApi/replymsg', {sender:sender,id:id,msg:msg,user:auth.currentUser().username});
        };
        inbox.deletemessage = function (id,sender) {
            return $http.post('/inboxApi/deletemessage', {sender:sender,id:id,user:auth.currentUser().username});
        };
        inbox.deletereply = function (id) {
            return $http.post('/inboxApi/deletereply', {id:id,user:auth.currentUser().username});
        };
        //
        inbox.getReceivedMsgs = function () {
            return $http.get('/inboxApi/getMsgs/ReceivedMsgs/'+auth.currentUser().username);
        };
        inbox.getSentMsgs = function () {
            return $http.get('/inboxApi/getMsgs/SentMsgs/'+auth.currentUser().username);
        };
        inbox.getMessageBody = function (id) {
            return $http.get('/inboxApi/getMessageBody/'+id+'/'+auth.currentUser().username);
        };
        return inbox;
    }
    angular.module('wontApp')
        .factory('inbox', ['$http','auth', InboxService]);
}());
/**
 * Created by Aditech on 9/25/2016.
 */
(function () {
    'use strict';
    angular.module('wontApp')
        .directive('homeDesktop', function () {
            return{
                restrict: 'E',
                templateUrl: 'partials/templates/home/home-desktop.html',
                link: function (scope, element, attrs) {

                }
            }
        }).directive('homeMobile' ,function () {
        return{
            restrict: 'E',
            templateUrl: 'partials/templates/home/home-mobile.html',
            link: function (scope, element, attrs) {

            }
        }
    }).directive('createTaah', function () {
        return{
            restrict: 'AE',
            templateUrl: 'partials/templates/createTaah.tpl.html',
            link: function (scope, element, attrs) {

            }
        }
    }).directive('navMobile', function () {
        return{
            restrict: 'E',
            controller: 'navController',
            templateUrl: 'partials/templates/mobile/nav.mob.html',
            link: function (scope, element, attrs) {

            }
        }
    }).directive('leftBar', function () {
        return{
            restrict: 'E',
            controller: 'navController',
            templateUrl: 'partials/templates/mobile/leftbar.html',
            link: function (scope, element, attrs) {

            }
        }
    }).directive('rightBar', function () {
        return{
            restrict: 'E',
            controller: 'navController',
            templateUrl: 'partials/templates/mobile/rightbar.html',
            link: function (scope, element, attrs) {

            }
        }
    }).directive('refreshBrowser', function () {
        return{
            restrict: 'E',
            template: '<div id="refresh" style="display:none;" class="row">'+
            '               <div class="col-md-12 wt-middle">'+
            '                   <h2 class="h2 text-muted">Refresh your browser</h2>'+
            '                   <button class="btn mob-primary" ng-click="reloadPage();">Refresh</button>'+
            '               </div>'+
            '          </div>'
        }
    }).directive('contributionBox', function () {
        return{
            restrict: 'E',
            template: "<md-button ng-click='revealCont(\"contributionBox\");' class='contribution-button'  aria-label='Your contribution' >" +
            "               <i>Your contribution</i> " +
            "          </md-button> " +
            "          <div id='contributionBox' class='contribution-box'> " +
            "               <div>" +
            "                    <div>" +
            "                        <a ng-click='revealCont(\"contributionBox\");' class='contribution-close'>" +
            "                               <i class='ion ion-close'></i>" +
            "                       </a> " +
            "                   </div> " +
            "                   <input class='form-control' name='uname' ng-model='Suname' placeholder='Enter full name'/> " +
            "                   <textarea class='form-control' name='body' ng-model='Smessage' placeholder='Your contribution (Your contribution is very important to us)'></textarea> " +
            "                   <button ng-click='SaveSuggestion();' ng-disabled='isProcessing' class='btn btn-primary'><span ng-show='loading'>loading..</span><span ng-hide='loading'>Drop it!</span></button>" +
            "                </div> " +
            "           </div>"
        }
    })
})();
/**
 * Created by Aditech on 1/14/2016.
 */
(function(){
    'use strict';
    var uniqueUsername  = function($http){
        var toId;
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elem, attr, ctrl) {
                scope.$watch(attr.ngModel, function(value) {
                    if(toId) clearTimeout(toId);
                    toId = setTimeout(function(){
                        $http.get('/validate/uniqueUsername/'+ value).success(function() {
                            ctrl.$setValidity('uniqueUsername', true);
                        }).error(function(){ ctrl.$setValidity('uniqueUsername', false)});
                    }, 200);
                });
            }
        };
    };
    var uniqueEmail = function($http){
        var toId;
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elem, attr, ctrl) {
                scope.$watch(attr.ngModel, function(value) {
                    if(toId) clearTimeout(toId);
                    toId = setTimeout(function(){
                        $http.get('/validate/uniqueEmail/' + value).success(function() {
                            ctrl.$setValidity('uniqueEmail', true);
                        }).error(function(){ ctrl.$setValidity('uniqueEmail', false)});
                    }, 200);
                });
            }
        };
    };
    var passwordMatch = function(){
        return {
            restrict: 'A',
            scope:true,
            require: 'ngModel',
            link: function (scope, elem , attrs,control) {
                var checker = function () {
                    var e1 = scope.$eval(attrs.ngModel);
                    var e2 = scope.$eval(attrs.passwordMatch);
                    if(e2!==null)
                        return e1 === e2;
                };
                scope.$watch(checker, function (n) {
                    control.$setValidity("passwordNoMatch", n);
                });
            }
        };
    } ;
    var validCredential = function($http){
        var toId;
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elem, attr, ctrl) {
                scope.$watch(attr.ngModel, function(value) {
                    if(toId) clearTimeout(toId);
                    toId = setTimeout(function(){
                        $http.get('/validate/validCredential/' + value).success(function() {
                            ctrl.$setValidity('validCredential', true);
                        }).error(function(){ ctrl.$setValidity('validCredential', false)});
                    }, 200);
                });
            }
        };
    };
    var uniqueTaahname  = function($http){
        var toId;
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elem, attr, ctrl) {
                scope.$watch(attr.ngModel, function(value) {
                    if(toId) clearTimeout(toId);
                    toId = setTimeout(function(){
                        $http.get('/validate/uniqueTaahname/' + value).success(function() {
                            ctrl.$setValidity('uniqueTaahname', true);
                        }).error(function(){ ctrl.$setValidity('uniqueTaahname', false)});
                    }, 200);
                });
            }
        };
    };
    var validPass = function($http,auth){
        var toId;
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elem, attr, ctrl) {
                scope.$watch(attr.ngModel, function(value) {
                    if(toId) clearTimeout(toId);
                    toId = setTimeout(function(){
                        $http.post('/api/checkpass', {username:auth.currentUser().username,password:value}).success(function() {
                            ctrl.$setValidity('validPass', true);
                        }).error(function(){ ctrl.$setValidity('validPass', false)});
                    }, 200);
                });
            }
        };
    };
    angular.module('wontApp')
        .directive('uniqueUsername', ['$http',uniqueUsername ]);
    angular.module('wontApp')
        .directive('uniqueEmail', ['$http',uniqueEmail]);
    angular.module('wontApp')
        .directive('passwordMatch', [passwordMatch]);
    angular.module('wontApp')
        .directive('validCredential', ['$http',validCredential]);
    angular.module('wontApp')
        .directive('uniqueTaahname', ['$http',uniqueTaahname ]);
    angular.module('wontApp')
        .directive('validPass', ['$http','auth',validPass]);

})();
(function () {
    'use strict';

    angular.module('wontApp').directive('cuFocus', function(){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attrs, controller){
                controller.$focused = false;
                element.bind('focus', function(e){
                    scope.$apply(function() { controller.$focused = true; });
                }).bind('blur', function(e){
                    scope.$apply(function() { controller.$focused = false; });
                });
            }
        };
    });
    function removeUnwanted(){
        return{
            restrict: 'A',
            require: 'ngModel',
            link: function (scope,elem, attr, ctrl) {
                elem.bind('keyup', function (e) {
                    scope.$apply(function () {
                        var b = new RegExp;
                        var a = elem[0].id;
                        if (a === "email") {
                            b = /[' "]/gi
                        } else {
                            if (a === "username") {
                                b = /[^a-z0-9_]/gi
                            } else {
                                if (a === "fname") {
                                    b = /[^a-z0-9- ]/gi
                                } else {
                                    if (a === "lname") {
                                        b = /[^a-z0-9- ]/gi
                                    }else{
                                        if(a === 'taahname'){
                                            b = /[^a-z0-9_]/gi
                                        }
                                    }
                                }
                            }
                        }
                        elem[0].value = elem[0].value.replace(b, "");
                    })
                })
            }
        }
    };
    angular.module('wontApp')
        .directive('removeUnwanted',removeUnwanted );
})();
/**
 * Created by Alhassan on 8/6/2015.
 */
(function () {
    function Thumb($window){
        var helper = {
            support: !!($window.FileReader && $window.CanvasRenderingContext2D),
            isFile: function(item) {
                return angular.isObject(item) && item instanceof $window.File;
            },
            isImage: function(file) {
                var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };
        return {
            restrict: 'A',
            template: '<canvas/>',
            link: function(scope, element, attributes) {
                if (!helper.support) return;

                var params = scope.$eval(attributes.ngThumb);

                if (!helper.isFile(params.file)) return;
                if (!helper.isImage(params.file)) return;

                var canvas = element.find('canvas');
                var reader = new FileReader();

                reader.onload = onLoadFile;
                reader.readAsDataURL(params.file);

                function onLoadFile(event) {
                    var img = new Image();
                    img.onload = onLoadImage;
                    img.src = event.target.result;
                }

                function onLoadImage() {
                    var width = params.width || this.width / this.height * params.height;
                    var height = params.height || this.height / this.width * params.width;
                    canvas.attr({ width: width, height: height });
                    canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
                }
            }
        };
    }


    'use strict';
    angular.module('wontApp')
        .directive('ngThumb',['$window',Thumb]);

})();
(function(){
    'use strict';
    angular.module('wontApp')
        .filter('hostnameFromUrl', function () {
            return function (str){
                var url = document.createElement('a');

                url.href = str;

                return url.hostname;
            };
        });
})();
/**
 * Created by Aditech on 2/9/2016.
 */
(function(){
    'use strict';
    angular.module('wontApp')
        .filter('cut', function () {
            return function (value, wordwise, max, tail) {
                if (!value) return '';

                max = parseInt(max, 10);
                if (!max) return value;
                if (value.length <= max) return value;

                value = value.substr(0, max);
                if (wordwise) {
                    var lastspace = value.lastIndexOf(' ');
                    if (lastspace != -1) {
                        value = value.substr(0, lastspace);
                    }
                }

                return value + (tail || ' …');
            };
        })
        .filter('startFrom', function(){
            return function(data, start){
                return data.slice(start);
            };
        });
})();
