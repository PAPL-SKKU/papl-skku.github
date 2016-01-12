function isMobile() {
    if ($(".navbar-toggle").css("display") != "none")
        return true;
    return false;
}

function initGoogleMap() {
    var myLatlng = new google.maps.LatLng(37.2915961,126.9770329);
    var map_canvas = document.getElementById('map_canvas');
    var map_options = {
        center: myLatlng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        panControl: true,
        scrollwheel: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
            style: google.maps.ZoomControlStyle.SMALL
        }
    }
    var map = new google.maps.Map(map_canvas, map_options)
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'We are Here!'
    });

    if (isMobile()) {
        map.setOptions({draggable: false});
    }
}


var news = new function() {
    var key = "AIzaSyBCuko-9R_C1UcqoUmynnEdtoURKYcoth4" // skku.papl
    // var key = "AIzaSyA4axePa6_b-OsuZq2Cm-JG3Up0njuv9Xw"; // unknown key from web for test
    // var id = "+BarackObama";
    var id = "104699396985331226920"; // skku.papl
    var maxItem = 10;
    var pageToken = "";
    var nextPageToken = "";
    var pageTokenHistory = [];

    function init() {
        gapi.client.setApiKey(key);
        gapi.client.load('plus','v1', load);
    }

    function setMaxItem(e) {
        maxItem = e;
    }

    function waiting() {
        $("#news h2").html("<h2>What's New <i class='fa fa-refresh fa-spin fa-lg'></i></h2>");
        $("#news .news.target").html("");
    }


    function getFormattedDate(d) {
        var Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var year = d.getFullYear();
        var month = d.getMonth().toString();
        var date = d.getDate().toString();

        if (date.length < 2)
            date = "0" + date;

        return Months[month] + " " + date + ", " + year;
    }

    function load() {
        var options = {userId: id, collection: "public", maxResults: maxItem,
            pageToken: pageToken};

        var b;
        while (true) {
            try {
                b = gapi.client.plus.activities.list(options);
                break;
            } catch (err) {
                continue;
            }
        }

        b.execute(function(e) {
            for (var i=0; i<e.items.length; i++) {
                var item = e.items[i];
                var date = new Date(item.updated);
                var url = item.url;
                // var img = item.object.attachments[0].image.url;
                var title = "";
                var content = item.object.content;

                if (content === "")
                    content = "No Title";
                else
                    content = content.split("<br />")[0];

                var html = "<li>";
                html += "<span class='date'>"
                html += getFormattedDate(date);
                html += "</span>"
                // html += "<strong>";
                // html += title;
                // html += "</strong> ";
                html += "<a href=\""+url+"\">";
                html += content;
                html += "</a>";
                html += "</li>";

                $("#news-target").append(html);
                $("#news i").remove();
            }
            if (e.nextPageToken != undefined) {
                nextPageToken = e.nextPageToken;
            }
        });
    }

    return {
        init: init,
        setMaxItem: setMaxItem,
        prev: function() {
            waiting();
            pageToken = pageTokenHistory.pop();
            load();
        },

        next: function() {
            waiting();
            pageTokenHistory.push(pageToken);
            pageToken = nextPageToken;
            load();
        }
    }
}


var initRecentNews = news.init;

function teamFilter(team) {
    $(".person").css("visibility", "visible");
    if (team === "all") {
        $(".person").show(400);

    } else {
        $(".person."+team+"").show(400);
        $(".person").not(".all, ."+team+"").hide(400);
    }

}

function loadPeople(person, all) {
    function template(c) {
        var content =   "<div class='person col-md-2 col-sm-3 col-xs-6 wow bounceIn "+c.team+"'>\
                            <a href='"+c.url+"' class='thumbnail' target='_blank'>\
                            <img src='"+c.picture+"'>\
                            <div class='caption'>\
                                <h4>"+c.name_en+"<br><small>"+c.name_kr+"</small></h4>\
                            </div>\
                            </a>\
                        </div>";
        return content;
    }

    function alumni(c) {
        var content =   "<div class='row wow bounceIn'>\
                            <div class='col-xs-12'>\
                                <h4>"+c.name_en+" <small>("+c.name_kr+")</small></h4>\
                                <p>"+c.status+". Now at "+c.position+"</p>\
                            </div>\
                        </div>";
        return content;
    }

    for (var i in person) {
        var c = person[i];

        switch (c.status) {
            case "Faculty":
                $("#faculty .row").append(template(c));
                break;
            case "PhD":
                $("#phd .row").append(template(c));
                break;
            case "Post MS":
            case "Post BS":
                $("#ra .row").append(template(c));
                break;
            case "MS":
            case "ABD":
                $("#ms .row").append(template(c));
                break;
            default:
                $("#alumni").append(alumni(c));
        }
    }
}

function loadPubs(paper, all, team) {
    var title;
    for (var i in paper) {
        var c = paper[i];
        if (c.pdf != "") title = "<a href='"+c.pdf+"'>"+c.title+" <i class='fa fa-file-pdf-o'></i></a>";
        else title = c.title;

        var content = "\
        <div class='row paper'>\
            <div class='col-xs-12'>\
                <h4>"+title+"</h4>\
                <p>\
                "+c.authors+"<br>\
                <i>"+c.conference+"</i> (<b>"+c.abbr+"</b>), "+c.place+", "+c.date+". "+c.remark+"\
                </p>\
            </div>\
        </div>";
        if (team != undefined && c.team.search(new RegExp("(\\s|^)"+team)) >= 0) {
            $(".team.pubs").append(content);
        } else if (c.selected || all) {
            if (c.category == "conference" || c.category == "journal")
                $("#conference").append(content);
            else // if (c.category == "workshop")
                $("#workshop").append(content);
        }
    }
}

function loadTeamBtn() {
    var dropdown = "";
    var filter = "";
    for (var i in team) {
        filter += "<a href=\"javascript:teamFilter('"+team[i].key+"')\" class='btn btn-default'>"+team[i].name+"</a>";
    }
    $("#people .btn-group").append(filter);
}

function loadResearchArea(team) {
    for (var i in team) {
        var template = "\
        <div class=\"research col-xs-6 col-md-3 wow fadeInDown\" data-wow-delay=\"0.4s\">\
            <a href=\"team/"+team[i].key+".html\" class=\"thumbnail\">\
                <img src=\""+team[i].thumbnail+"\">\
                <div class=\"caption\">\
                    <h4>"+team[i].name+"</h4>\
                    <p>\
                    "+team[i].desc+"\
                    </p>\
                </div>\
            </a>\
        </div>";
        $("#research").append(template);
    }
}

function loadMenu(team, current) {
    var dropdown = "";
    var filter = "";
    for (var i in team) {
        dropdown += "<li><a href='team/"+team[i].key+".html'>"+team[i].name+"</a>";
    }

   $(".nav").append("\
        <li><a href=\"index.html\">Home</a></li>\n\
        <li class=\"dropdown\">\n\
            <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n\
                Projects<span class=\"caret\"></span></a>\n\
            <ul class=\"dropdown-menu\" role=\"menu\">\n\
            </ul>\n\
        </li>\n\
        <li><a href=\"people\">People</a></li>\n\
        <li><a href=\"pubs\">Publications</a></li>\n\
        <li><a href=\"contact.html\">Contact</a></li>\n\
        <li><a href=\"code.html\">Code</a></li>");

    $(".nav .dropdown .dropdown-menu").append(dropdown);
 
    // highlight current page
    $('a[href="' + this.location.pathname.split("/").pop() + '"]').parent().addClass('active');
}

/* mobile nav toggle */
// if (!isMobile()) {
    // new WOW().init();
// } else {
    // $('nav a').on('click', function() {
        // $(".navbar-toggle").click();
    // });
// }

