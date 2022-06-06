(function () {

    'use strict';

    function vendrEmailResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            sendOrderEmail: function (emailTemlateId, orderId, to, languageIsoCode) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("emailApiBaseUrl", "SendOrderEmail"), { 
                        emailTemlateId: emailTemlateId,
                        orderId: orderId,
                        to: to,
                        languageIsoCode: languageIsoCode
                    }),
                    "Failed to send order email");
            },

            sendGiftCardEmail: function (emailTemlateId, giftCardId, to, languageIsoCode) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("emailApiBaseUrl", "SendGiftCardEmail"), {
                        emailTemlateId: emailTemlateId,
                        giftCardId: giftCardId,
                        to: to,
                        languageIsoCode: languageIsoCode
                    }),
                    "Failed to send gift card email");
            },

            sendDiscountEmail: function (emailTemlateId, discountId, to, languageIsoCode) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("emailApiBaseUrl", "SendDiscountEmail"), {
                        emailTemlateId: emailTemlateId,
                        discountId: discountId,
                        to: to,
                        languageIsoCode: languageIsoCode
                    }),
                    "Failed to send discount email");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrEmailResource', vendrEmailResource);

}());