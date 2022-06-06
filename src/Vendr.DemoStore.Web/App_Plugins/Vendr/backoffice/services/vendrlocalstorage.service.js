(function () {

    'use strict';

    function vendrLocalStorage($cookies) {

        var supportsLocalStorage = (function () {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        })();

        var stash = function (key, value) {
            if (supportsLocalStorage) {
                localStorage.setItem(key, value);
            } else {
                $cookies[key] = value;
            }
        };

        var unstash = function (key) {
            if (supportsLocalStorage) {
                return localStorage.getItem(key);
            } else {
                return $cookies[key];
            }
        };

        var api = {
            get: function (key, fallback) {
                var rawVal = unstash(key);
                if (!rawVal) return fallback;
                return JSON.parse(rawVal);
            },
            set: function (key, obj) {
                stash(key, JSON.stringify(obj));
            }
        };

        return api;

    };

    angular.module('vendr.services').factory('vendrLocalStorage', vendrLocalStorage);

}());