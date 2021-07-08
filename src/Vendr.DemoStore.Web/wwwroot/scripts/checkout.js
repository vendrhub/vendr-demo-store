(function(){

    // Initialization
    function initSm(){
        
        $("body").on("click.sm", "#order-summary-toggle", function (e) {
            e.preventDefault();
            var toShow = $("#order-summary").hasClass("hidden");
            if (toShow) {
                showMobileOrderSummary();
            } else {
                hideMobileOrderSummary();
            }
        });

        hideMobileOrderSummary();

    }

    function initLg() {

        $("body").off(".sm");

    }

    function initCommon()
    {
        $("input[name=shippingSameAsBilling]").on("click", function () {
            showHideShippingInfo(true);
        });

        $("#acceptTerms").on("click", enableDisableContinueButton);

        var errors = $(".validation-summary-errors");
        if (errors.length > 0) {
            Toastify({
                text: errors.find("ul li:first-child").text(),
                duration: 3000,
                gravity: "bottom", // `top` or `bottom`
                position: 'center', // `left`, `center` or `right`
                backgroundColor: "#f56565",
                className: "",
                stopOnFocus: true, // Prevents dismissing of toast on hover
            }).showToast();
        }

        showHideShippingInfo(false);
    }

    function showMobileOrderSummary() {
        $("#order-summary").removeClass("hidden");
        $("#order-summary-toggle__text-open").removeClass("hidden");
        $("#order-summary-toggle__text-closed").addClass("hidden");
    }

    function hideMobileOrderSummary() {
        $("#order-summary").addClass("hidden");
        $("#order-summary-toggle__text-open").addClass("hidden");
        $("#order-summary-toggle__text-closed").removeClass("hidden");
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
        
        var enableContinueButton = $("#acceptTerms").is(":checked");
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
        query: '(max-width: 1023px)',
        onEnter: initSm
    });
    
    ssm.addState({
        id: 'lg',
        query: '(min-width: 1024px)',
        onEnter: initLg
    });

    initCommon();

})();


