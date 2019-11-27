(function(){

    // Initialization
    function initSm(){

    }

    function initMd() {

    }

    function initCommon()
    {
        $("input[name=shippingSameAsBilling]").on("click", function () {
            showHideShippingInfo(true);
        });

        $("input[name=acceptTerms]").on("click", enableDisableContinueButton);

        showHideShippingInfo(false);
    }

    function showHideShippingInfo(clearValues)
    {
        var hideShippingInfo = $("input[name=shippingSameAsBilling]").is(":checked");
        if (hideShippingInfo) {
            $("#shipping-info").hide();
        } else {
            if (clearValues) {
                //$("input[type=text][name^=shipping]").val("");
            }
            $("#shipping-info").show();
        }
    }

    function enableDisableContinueButton() {
        
        var enableContinueButton = $("input[name=acceptTerms]").is(":checked");
        if (enableContinueButton) {
            $("#continue-disabled").hide();
            $("#continue").show();
        } else {
            $("#continue-disabled").show();
            $("#continue").hide();
        }

    }

    // Setup responsive states
    ssm.addState({
        id: 'sm',
        query: '(max-width: 767px)',
        onEnter: initSm
    });
    
    ssm.addState({
        id: 'md',
        query: '(min-width: 768px)',
        onEnter: initMd
    });

    initCommon();

})();


