(function () {

    'use strict';

    function vendrActivityLogResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getActivityLogs: function (storeId, currentPage, itemsPerPage) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("activityLogApiBaseUrl", "GetActivityLogs", {
                        storeId: storeId,
                        currentPage: currentPage,
                        itemsPerPage: itemsPerPage
                    })),
                    "Failed to get activity logs");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrActivityLogResource', vendrActivityLogResource);

}());
(function () {

    'use strict';

    function vendrAnalyticsResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getAnalyticsDashboardConfig: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetAnalyticsDashboardConfig", {
                        storeId: storeId
                    })),
                    "Failed to get analytics dashboard config");
            },

            getTotalOrdersReport: function (storeId, from, to, compareFrom, compareTo) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetTotalOrdersReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo
                    })),
                    "Failed to get total orders report");
            },

            getTotalRevenueReport: function (storeId, from, to, compareFrom, compareTo) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetTotalRevenueReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo
                    })),
                    "Failed to get total revenue report");
            },

            getAverageOrderValueReport: function (storeId, from, to, compareFrom, compareTo) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetAverageOrderValueReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo
                    })),
                    "Failed to get average order value report");
            },

            getCartConversionRatesReport: function (storeId, from, to, compareFrom, compareTo) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetCartConversionRatesReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo
                    })),
                    "Failed to get cart conversion rates report");
            },

            getRepeatCustomerRatesReport: function (storeId, from, to, compareFrom, compareTo) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetRepeatCustomerRatesReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo
                    })),
                    "Failed to get repeat customer rates report");
            },

            getTopSellingProductsReport: function (storeId, from, to, compareFrom, compareTo) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetTopSellingProductsReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo
                    })),
                    "Failed to get top selling products report");
            },

        };

    };

    angular.module('vendr.resources').factory('vendrAnalyticsResource', vendrAnalyticsResource);

}());
(function () {

    'use strict';

    function vendrCountryResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getIso3166CountryRegions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetIso3166CountryRegions")),
                    "Failed to get ISO 3166 country regions");
            },

            getCountries: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetCountries", { 
                        storeId: storeId 
                    })),
                    "Failed to get countries");
            },

            getRegions: function (storeId, countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetRegions", {
                        storeId: storeId,
                        countryId: countryId
                    })),
                    "Failed to get regions");
            },

            getCountriesWithRegions: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetCountriesWithRegions", {
                        storeId: storeId
                    })),
                    "Failed to get countries");
            },

            getCountry: function (countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetCountry", { 
                        countryId: countryId
                    })),
                    "Failed to get country");
            },

            getRegion: function (regionId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetRegion", {
                        regionId: regionId
                    })),
                    "Failed to get region");
            },

            createCountry: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "CreateCountry", {
                        storeId: storeId
                    })),
                    "Failed to create country");
            },

            createAllCountryRegions: function (storeId, defaultCurrencyId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "CreateAllCountryRegions", {
                        storeId: storeId,
                        defaultCurrencyId: defaultCurrencyId
                    })),
                    "Failed to create all countries and regions");
            },

            createRegion: function (storeId, countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "CreateRegion", {
                        storeId: storeId,
                        countryId: countryId
                    })),
                    "Failed to create region");
            },

            saveCountry: function (country) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "SaveCountry"), country),
                    "Failed to save country");
            },

            saveRegion: function (region) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "SaveRegion"), region),
                    "Failed to save region");
            },

            deleteCountry: function (countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "DeleteCountry", {
                        countryId: countryId
                    })),
                    "Failed to delete country");
            },

            deleteRegion: function (regionId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "DeleteRegion", {
                        regionId: regionId
                    })),
                    "Failed to delete region");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrCountryResource', vendrCountryResource);

}());
(function () {

    'use strict';

    function vendrCultureResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getCultures: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("cultureApiBaseUrl", "GetCultures")),
                    "Failed to get cultures");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrCultureResource', vendrCultureResource);

}());
(function () {

    'use strict';

    function vendrCurrencyResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getCurrencies: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "GetCurrencies", { 
                        storeId: storeId 
                    })),
                    "Failed to get currencies");
            },

            getCurrency: function (currencyId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "GetCurrency", {
                        currencyId: currencyId
                    })),
                    "Failed to get currency");
            },

            createCurrency: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "CreateCurrency", {
                        storeId: storeId
                    })),
                    "Failed to create currency");
            },

            saveCurrency: function (currency) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "SaveCurrency"), currency),
                    "Failed to save currency");
            },

            deleteCurrency: function (currencyId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "DeleteCurrency", {
                        currencyId: currencyId
                    })),
                    "Failed to delete currency");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrCurrencyResource', vendrCurrencyResource);

}());
//(function () {

//    'use strict';

//    function vendrDashboardResource($http, umbRequestHelper, vendrRequestHelper) {

//        return {
            
//            getStoreStatsForToday: function (storeId) {
//                return umbRequestHelper.resourcePromise(
//                    $http.get(vendrRequestHelper.getApiUrl("dashboardApiBaseUrl", "GetStoreStatsForToday", {
//                        storeId: storeId
//                    })),
//                    "Failed to get store stats for today");
//            }

//        };

//    };

//    angular.module('vendr.resources').factory('vendrDashboardResource', vendrDashboardResource);

//}());
(function () {

    'use strict';

    function vendrDictionaryResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            searchKeys: function (searchKey, maxItems, parentKey) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "SearchKeys"), {
                        searchKey: searchKey,
                        maxItems: maxItems,
                        parentKey: parentKey
                    }),
                    "Failed to search dictionary items");
            },

            ensureRootDictionaryItem: function (key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "EnsureRootDictionaryItem", {
                        key: key
                    })),
                    "Failed to search dictionary items");
            },

            tryGetDictionaryItemIdByKey: function (key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "TryGetDictionaryItemIdByKey", {
                        key: key
                    })),
                    "Failed to get dictionary item");
            },

            getDictionaryItemByKey: function (key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "GetDictionaryItemByKey"),
                    {
                        key: key
                    }),
                    "Failed to get dictionary item");
            },

            getDictionaryItemById: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "GetDictionaryItemById", {
                        id: id
                    })),
                    "Failed to get dictionary item");
            },

            createDictionaryItem: function (parentId, key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "CreateDictionaryItem", {
                        parentId: parentId,
                        key: key
                    })),
                    "Failed to create dictionary item");
            },

            saveDictionaryItem: function (entity) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "SaveDictionaryItem"),
                        entity),
                    "Failed to save dictionary item");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrDictionaryResource', vendrDictionaryResource);

}());
(function () {

    'use strict';

    function vendrDiscountResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getDiscountRuleProviderDefinitions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRuleProviderDefinitions")),
                    "Failed to get discount rule provider definitions");
            },

            getDiscountRuleProviderScaffold: function (discountRuleProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRuleProviderScaffold", {
                        discountRuleProviderAlias: discountRuleProviderAlias
                    })),
                    "Failed to get discount rule provider scaffold");
            },

            getDiscountRewardProviderDefinitions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRewardProviderDefinitions")),
                    "Failed to get discount reward provider definitions");
            },

            getDiscountRewardProviderScaffold: function (discountRewardProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRewardProviderScaffold", {
                        discountRewardProviderAlias: discountRewardProviderAlias
                    })),
                    "Failed to get discount reward provider scaffold");
            },

            getDiscounts: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscounts", { 
                        storeId: storeId 
                    })),
                    "Failed to get discounts");
            },

            getDiscount: function (discountId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscount", { 
                        discountId: discountId
                    })),
                    "Failed to get discount");
            },

            createDiscount: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "CreateDiscount", {
                        storeId: storeId
                    })),
                    "Failed to create discount");
            },

            saveDiscount: function (discount) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "SaveDiscount"), discount),
                    "Failed to save discount");
            },

            deleteDiscount: function (discountId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "DeleteDiscount", {
                        discountId: discountId
                    })),
                    "Failed to delete discount");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrDiscountResource', vendrDiscountResource);

}());
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
            }

        };

    };

    angular.module('vendr.resources').factory('vendrEmailResource', vendrEmailResource);

}());
(function () {

    'use strict';

    function vendrEmailTemplateResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getEmailTemplateCount: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "GetEmailTemplateCount", {
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get email template count");
            },

            getEmailTemplates: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "GetEmailTemplates", { 
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get email templates");
            },

            getEmailTemplate: function (emailTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "GetEmailTemplate", { 
                        emailTemplateId: emailTemplateId
                    })),
                    "Failed to get email template");
            },

            createEmailTemplate: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "CreateEmailTemplate", {
                        storeId: storeId
                    })),
                    "Failed to create email template");
            },

            saveEmailTemplate: function (emailTemplate) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "SaveEmailTemplate"), emailTemplate),
                    "Failed to save email template");
            },

            deleteEmailTemplate: function (emailTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "DeleteEmailTemplate", {
                        emailTemplateId: emailTemplateId
                    })),
                    "Failed to delete email template");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrEmailTemplateResource', vendrEmailTemplateResource);

}());
(function () {

    'use strict';

    function vendrEntityResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getStoreByEntityId: function (entityType, entityId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "GetStoreByEntityId", {
                        entityType: entityType,
                        entityId: entityId
                    })),
                    "Failed to get basic store by entity id");
            },

            getEntity: function (entityType, entityId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "GetEntity", {
                        entityType: entityType,
                        entityId: entityId
                    })),
                    "Failed to get entity");
            },

            getEntities: function (entityType, storeId, parentId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "GetEntities", {
                        entityType: entityType,
                        storeId: storeId,
                        parentId: parentId
                    })),
                    "Failed to get entities");
            },

            deleteEntity: function (entityType, entityId, storeId, parentId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "DeleteEntity", {
                        entityType: entityType,
                        entityId: entityId,
                        storeId: storeId,
                        parentId: parentId
                    })),
                    "Failed to delete entity");
            },

            sortEntities: function (entityType, sortedEntityIds, storeId, parentId) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "SortEntities"), {
                        entityType: entityType,
                        sortedEntityIds: sortedEntityIds,
                        storeId: storeId,
                        parentId: parentId
                    }),
                    "Failed to sort entities");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrEntityResource', vendrEntityResource);

}());
(function () {

    'use strict';

    function vendrExportTemplateResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getExportTemplateCount: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "GetExportTemplateCount", {
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get export template count");
            },

            getExportTemplates: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "GetExportTemplates", { 
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get export templates");
            },

            getExportTemplate: function (exportTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "GetExportTemplate", { 
                        exportTemplateId: exportTemplateId
                    })),
                    "Failed to get export template");
            },

            createExportTemplate: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "CreateExportTemplate", {
                        storeId: storeId
                    })),
                    "Failed to create export template");
            },

            saveExportTemplate: function (exportTemplate) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "SaveExportTemplate"), exportTemplate),
                    "Failed to save export template");
            },

            deleteExportTemplate: function (exportTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "DeleteExportTemplate", {
                        exportTemplateId: exportTemplateId
                    })),
                    "Failed to delete export template");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrExportTemplateResource', vendrExportTemplateResource);

}());
(function () {

    'use strict';

    function vendrGiftCardResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            searchGiftCards: function (storeId, opts) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "SearchGiftCards", angular.extend({}, {
                        storeId: storeId
                    }, opts))),
                    "Failed to search gift cards");
            },

            generateGiftCardCode: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "GenerateGiftCardCode", {
                        storeId: storeId
                    })),
                    "Failed to generate gift card code");
            },

            getGiftCards: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "GetGiftCards", { 
                        storeId: storeId 
                    })),
                    "Failed to get gift cards");
            },

            getGiftCard: function (giftCardId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "GetGiftCard", { 
                        giftCardId: giftCardId
                    })),
                    "Failed to get gift card");
            },

            createGiftCard: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "CreateGiftCard", {
                        storeId: storeId
                    })),
                    "Failed to create gift card");
            },

            saveGiftCard: function (giftCard) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "SaveGiftCard"), giftCard),
                    "Failed to save gift card");
            },

            deleteGiftCard: function (giftCardId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "DeleteGiftCard", {
                        giftCardId: giftCardId
                    })),
                    "Failed to delete gift card");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrGiftCardResource', vendrGiftCardResource);

}());
(function () {

    'use strict';

    function vendrLicensingResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getLicensingInfo: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("licensingApiBaseUrl", "GetLicensingInfo")),
                    "Failed to get licensing info");
            }

        };

    }

    angular.module('vendr.resources').factory('vendrLicensingResource', vendrLicensingResource);

}());
(function () {

    'use strict';

    function vendrOrderResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            searchOrders: function (storeId, opts) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "SearchOrders", angular.extend({}, { 
                        storeId: storeId
                    }, opts))),
                    "Failed to search orders");
            },

            getOrder: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrder", { 
                        orderId: orderId
                    })),
                    "Failed to get order");
            },

            getOrderEmailConfig: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderEmailConfig", {
                        orderId: orderId
                    })),
                    "Failed to get order email config");
            },


            getOrderTransactionInfo: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderTransactionInfo", {
                        orderId: orderId
                    })),
                    "Failed to get order transaction info");
            },


            getOrderRegisteredCustomerInfo: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderRegisteredCustomerInfo", {
                        orderId: orderId
                    })),
                    "Failed to get order registered customer info");
            },


            getOrderHistoryByOrder: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderHistoryByOrder", {
                        orderId: orderId
                    })),
                    "Failed to get order history");
            },

            changeOrderStatus: function(orderId, orderStatusId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "ChangeOrderStatus", {
                        orderId: orderId,
                        orderStatusId: orderStatusId
                    })),
                    "Failed to change order status");
            },

            syncPaymentStatus: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "SyncPaymentStatus", {
                        orderId: orderId
                    })),
                    "Failed to sync payment");
            },

            cancelPayment: function(orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "CancelPayment", {
                        orderId: orderId
                    })),
                    "Failed to cancel payment");
            },

            capturePayment: function(orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "CapturePayment", {
                        orderId: orderId
                    })),
                    "Failed to capture payment");
            },

            refundPayment: function(orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "RefundPayment", {
                        orderId: orderId
                    })),
                    "Failed to refund payment");
            },

            saveOrder: function (order) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "SaveOrder"), order),
                    "Failed to save order status");
            },

            deleteOrder: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "DeleteOrder", {
                        orderId: orderId
                    })),
                    "Failed to delete order");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrOrderResource', vendrOrderResource);

}());
(function () {

    'use strict';

    function vendrOrderStatusResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getOrderStatuses: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "GetOrderStatuses", { 
                        storeId: storeId 
                    })),
                    "Failed to get order statuses");
            },

            getOrderStatus: function (orderStatusId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "GetOrderStatus", { 
                        orderStatusId: orderStatusId
                    })),
                    "Failed to get order status");
            },

            createOrderStatus: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "CreateOrderStatus", {
                        storeId: storeId
                    })),
                    "Failed to create order status");
            },

            saveOrderStatus: function (orderStatus) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "SaveOrderStatus"), orderStatus),
                    "Failed to save order status");
            },

            deleteOrderStatus: function (orderStatusId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "DeleteOrderStatus", {
                        orderStatusId: orderStatusId
                    })),
                    "Failed to delete order status");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrOrderStatusResource', vendrOrderStatusResource);

}());
(function () {

    'use strict';

    function vendrPaymentMethodResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getPaymentProviderDefinitions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentProviderDefinitions")),
                    "Failed to get payment provider definitions");
            },

            getPaymentProviderScaffold: function (paymentProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentProviderScaffold", {
                        paymentProviderAlias: paymentProviderAlias
                    })),
                    "Failed to get payment provider scaffold");
            },

            getPaymentMethods: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentMethods", { 
                        storeId: storeId 
                    })),
                    "Failed to get payment methods");
            },

            getPaymentMethod: function (paymentMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentMethod", {
                        paymentMethodId: paymentMethodId
                    })),
                    "Failed to get payment method");
            },

            createPaymentMethod: function (storeId, paymentProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "CreatePaymentMethod", {
                        storeId: storeId,
                        paymentProviderAlias: paymentProviderAlias
                    })),
                    "Failed to create payment method");
            },

            savePaymentMethod: function (paymentMethod) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "SavePaymentMethod"), paymentMethod),
                    "Failed to save payment method");
            },

            deletePaymentMethod: function (paymentMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "DeletePaymentMethod", {
                        paymentMethodId: paymentMethodId
                    })),
                    "Failed to delete payment method");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrPaymentMethodResource', vendrPaymentMethodResource);

}());
(function () {

    'use strict';

    function vendrPrintTemplateResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getPrintTemplateCount: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "GetPrintTemplateCount", {
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get print template count");
            },

            getPrintTemplates: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "GetPrintTemplates", { 
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get print templates");
            },

            getPrintTemplate: function (printTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "GetPrintTemplate", { 
                        printTemplateId: printTemplateId
                    })),
                    "Failed to get print template");
            },

            createPrintTemplate: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "CreatePrintTemplate", {
                        storeId: storeId
                    })),
                    "Failed to create print template");
            },

            savePrintTemplate: function (printTemplate) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "SavePrintTemplate"), printTemplate),
                    "Failed to save print template");
            },

            deletePrintTemplate: function (printTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "DeletePrintTemplate", {
                        printTemplateId: printTemplateId
                    })),
                    "Failed to delete print template");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrPrintTemplateResource', vendrPrintTemplateResource);

}());
(function () {

    'use strict';

    function vendrProductResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getStock: function (productReference, productVariantReference) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productApiBaseUrl", "GetStock", { 
                        productReference: productReference,
                        productVariantReference: productVariantReference
                    })),
                    "Failed to get stock");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrProductResource', vendrProductResource);

}());
(function () {

    'use strict';

    function vendrProductAttributeResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getProductAttributes: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributes", { 
                        storeId: storeId 
                    })),
                    "Failed to get product attributes");
            },

            getProductAttributesWithValues: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributesWithValues", {
                        storeId: storeId
                    })),
                    "Failed to get product attributes");
            },

            getProductAttribute: function (productAttributeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttribute", {
                        productAttributeId: productAttributeId
                    })),
                    "Failed to get product attribute");
            },

            createProductAttribute: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "CreateProductAttribute", {
                        storeId: storeId
                    })),
                    "Failed to create product attribute");
            },

            saveProductAttribute: function (productAttribute) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "SaveProductAttribute"), productAttribute),
                    "Failed to save product attribute");
            },

            deleteProductAttribute: function (productAttributeId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "DeleteProductAttribute", {
                        productAttributeId: productAttributeId
                    })),
                    "Failed to delete product attribute");
            },

            getProductAttributePresets: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributePresets", {
                        storeId: storeId
                    })),
                    "Failed to get product attribute presets");
            },

            getProductAttributePresetsWithAllowedAttributes: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributePresetsWithAllowedAttributes", {
                        storeId: storeId
                    })),
                    "Failed to get product attribute presets");
            },

            getProductAttributePreset: function (productAttributePresetId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributePreset", {
                        productAttributePresetId: productAttributePresetId
                    })),
                    "Failed to get product attribute preset");
            },

            createProductAttributePreset: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "CreateProductAttributePreset", {
                        storeId: storeId
                    })),
                    "Failed to create product attribute preset");
            },

            saveProductAttributePreset: function (productAttributePreset) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "SaveProductAttributePreset"), productAttributePreset),
                    "Failed to save product attribute preset");
            },

            deleteProductAttributePreset: function (productAttributePresetId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "DeleteProductAttributePreset", {
                        productAttributePresetId: productAttributePresetId
                    })),
                    "Failed to delete product attribute preset");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrProductAttributeResource', vendrProductAttributeResource);

}());
(function () {

    'use strict';

    function vendrShippingMethodResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getShippingMethods: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "GetShippingMethods", { 
                        storeId: storeId 
                    })),
                    "Failed to get shipping methods");
            },

            getShippingMethod: function (shippingMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "GetShippingMethod", {
                        shippingMethodId: shippingMethodId
                    })),
                    "Failed to get shipping method");
            },

            createShippingMethod: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "CreateShippingMethod", {
                        storeId: storeId
                    })),
                    "Failed to create shipping method");
            },

            saveShippingMethod: function (shippingMethod) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "SaveShippingMethod"), shippingMethod),
                    "Failed to save shipping method");
            },

            deleteShippingMethod: function (shippingMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "DeleteShippingMethod", {
                        shippingMethodId: shippingMethodId
                    })),
                    "Failed to delete shipping method");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrShippingMethodResource', vendrShippingMethodResource);

}());
(function () {

    'use strict';

    function vendrStoreResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getStores: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStores")),
                    "Failed to get stores");
            },

            getStoreSummariesForCurrentUser: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreSummariesForCurrentUser")),
                    "Failed to get store summaries for current user");
            },

            getBasicStore: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetBasicStore", { 
                        storeId: storeId
                    })),
                    "Failed to get basic store");
            },

            getBasicStoreByNodeId: function (nodeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetBasicStoreByNodeId", {
                        nodeId: nodeId
                    })),
                    "Failed to get basic store by node id");
            },

            getStore: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStore", {
                        storeId: storeId
                    })),
                    "Failed to get store");
            },

            getStoreAlias: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreAlias", {
                        storeId: storeId
                    })),
                    "Failed to get store alias");
            },

            getStoreOrderEditorConfig: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreOrderEditorConfig", {
                        storeId: storeId
                    })),
                    "Failed to get store order editor config");
            },

            createStore: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "CreateStore")),
                    "Failed to create store");
            },

            saveStore: function (store) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "SaveStore"), store),
                    "Failed to save store");
            },

            deleteStore: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "DeleteStore", {
                        storeId: storeId
                    })),
                    "Failed to delete store");
            },

            getStoreStatsForToday: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreStatsForToday", {
                        storeId: storeId
                    })),
                    "Failed to get store stats for today");
            },

            getStoreActionsForToday: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreActionsForToday", {
                        storeId: storeId
                    })),
                    "Failed to get store actions for today");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrStoreResource', vendrStoreResource);

}());
(function () {

    'use strict';

    function vendrTaxResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getTaxClasses: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "GetTaxClasses", { 
                        storeId: storeId 
                    })),
                    "Failed to get tax classes");
            },

            getTaxClass: function (taxClassId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "GetTaxClass", { 
                        taxClassId: taxClassId
                    })),
                    "Failed to get tax class");
            },

            createTaxClass: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "CreateTaxClass", {
                        storeId: storeId
                    })),
                    "Failed to create tax class");
            },

            saveTaxClass: function (taxClass) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "SaveTaxClass"), taxClass),
                    "Failed to save tax class ");
            },

            deleteTaxClass: function (taxClassId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "DeleteTaxClass", {
                        taxClassId: taxClassId
                    })),
                    "Failed to get delete class");
            }

        };

    }

    angular.module('vendr.resources').factory('vendrTaxResource', vendrTaxResource);

}());
(function () {

    'use strict';

    function vendrUtilsResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getEnumOptions: function (type) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("utilsApiBaseUrl", "GetEnumOptions", { 
                        type: type
                    })),
                    "Failed to get enum options");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrUtilsResource', vendrUtilsResource);

}());
