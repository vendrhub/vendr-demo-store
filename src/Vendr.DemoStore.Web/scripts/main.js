(function(){

    // Helpers
    function openMenu(){
        $("#menu-toggle-icon__menu").addClass("hidden");
        $("#menu-toggle-icon__close").removeClass("hidden");
        $("#menu").removeClass("hidden");
    }

    function closeMenu(){
        $("#menu-toggle-icon__menu").removeClass("hidden");
        $("#menu-toggle-icon__close").addClass("hidden");
        $("#menu").addClass("hidden");
    }

    // Initialization
    function initSm(){

        // Bind event handlers
        $("#menu-toggle").on("click", function (){
            if ($("#menu").hasClass("hidden")){
                openMenu();
            } else {
                closeMenu();
            }
        });

    }

    function initMd() {

        // Unbind event handlers
        $("#menu-toggle").off("click");

        // Reset DOM
        closeMenu();
    }

    function initCommon(){

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


