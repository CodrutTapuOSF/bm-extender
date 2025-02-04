(function () {
    /*global chrome */
    var win = chrome.extension.getBackgroundPage();
    var manifestData = chrome.runtime.getManifest();
    var $filter = $('.js-filter-logs');
    var activeLinks = [];

    renderExtensionVersion(manifestData);

    // we send and save the url on the background page window so it will always
    // remember the last demandware url visited
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        if (! isDWUrl(tabs[0].url)) {
            return;
        }

        var a = document.createElement("a");
        a.href = tabs[0].url;
        win.baseUrl = 'https://' + a.hostname;
    });


    // list the log files from the current date
    // the links are retrived from the requestLog via the background page
    win.background.getLinks(function (links, instanceHost) {
        activeLinks = links;

        renderLogsList();
        $('.js-base-url').html(instanceHost);
        win.baseUrl = 'https://' + instanceHost;
    });


    $(document).on('click', 'a', function (e) {
        e.preventDefault();
        var url;

        if ($(this).hasClass('js-options')) {
            openOptionsPage();
            return;
        }


        if ($(this).hasClass('js-open-tail-window')) {
            openTailLogWindow(this.href);
            return;
        }

        if ($(this).hasClass('js-base-link') && win.baseUrl) {
            url = win.baseUrl + this.pathname;
        } else {
            url = this.href;
        }

        if ($(this).hasClass('js-window')) {
            chrome.windows.create({
                url: url,
                type: 'popup',
                width: 700
            });
        } else {
            chrome.tabs.create({ url: url });
        }
    });

    $filter.on('input', function() {
        renderLogsList();
    });

    function isDWUrl(url) {
        return location.pathname.indexOf('on/demandware.store/Sites-Site') > -1;
    }

    function renderLogsList() {
        var $list = $('.js-loglist');
        var query = $filter.val().toLowerCase();
        var queryRegex = new RegExp(query, 'i');
        var html = '';

        activeLinks.filter(function(link) {
                if (!query) {
                    return true;
                }
                return link.split('/').pop().toLowerCase().indexOf(query) > -1;
            })
            .forEach(function (link) {
                var name = link.split('/').pop();

                if (query) {
                    name = name.replace(queryRegex, '<strong>$&</strong>');
                }

                html += `<li>
                     <a href="${link}">${name}</a> |
                     <a href="${link}" class="js-open-tail-window text-bold">tail</a>
                   </li>`;
            });

        $list.html(html);
    }

    function openOptionsPage() {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            chrome.tabs.create({
                url: chrome.runtime.getURL('options.html')
            });
        }
    }

    function openTailLogWindow(logPath) {
        var w = 1200;
        var h = 800;
        var left = (screen.width/2)-(w/2);
        var top = (screen.height/2)-(h/2);
        var url = new URL(chrome.runtime.getURL('logTail/logTail.html'));
        url.searchParams.append('logPath', logPath);

        chrome.windows.create({
            'url': url.toString(),
            'type': 'popup',
            'width': w,
            'height': h,
            'left': left,
            'top': top
        });
    }

    function renderExtensionVersion(manifestData) {
        $('.js-version').html(manifestData.version);
    }

})();

