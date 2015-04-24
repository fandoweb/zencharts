'use strict';
// ------------------------------
// ------------------------------
// ------------------------------
// URL Watcher
// Watch for URLs in the token
// ------------------------------
// ------------------------------
// ------------------------------



// ------------------------------
// ------------------------------
// ------------------------------
// APIRequest Prototype
// ------------------------------
// ------------------------------
// ------------------------------
function APIRequest(options) {
  this.url            = options.url;
  this.token          = options.token;
  // this.JSONresponse   = {};
};

APIRequest.prototype.makeAjaxRequest = function(callbackComplete) {
  console.log('request made');
  var self = this;
  var ajax_options = {
    method: 'GET',
    async: true,
    // Add a Basic Auth token in the header
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + self.token);
    }
  };

  // Make the request...
  $.ajax(this.url, ajax_options)
    // Done
    .done(function(data) {
      self.handleDone(data, self)
    })
    // Failure
    .fail( this.handleFail )
    // Complete
    .complete(function(){
      self.handleComplete(callbackComplete);
    })
    // Always
    .always( this.handleAlways );
};

APIRequest.prototype.handleDone = function(data, self) {
  console.log( "Ajax success." );
  self.JSONresponse = data;
};

APIRequest.prototype.handleFail = function(xhr, textStatus, errorThrown) {
  console.log( "Ajax fail." );
  console.log(xhr);
  console.log(textStatus);
  console.log(errorThrown);
};

APIRequest.prototype.handleComplete = function(callbackComplete) {
  console.log("Ajax complete, hide spinner.");  
  callbackComplete();    
};

APIRequest.prototype.handleAlways = function() {
  console.log( "always" );
  // console.log( data );
};

APIRequest.prototype.getJSON = function() {
  return this.JSONresponse;
}


// ------------------------------
// ------------------------------
// ------------------------------
// Graphs
// ------------------------------
// ------------------------------
// ------------------------------
var GraphA = (function($) {

  return { 

    init: function(data) {
      var percentages = this.getPercentages(data);
      graphA.series[0].data[0].y = percentages[0];
      graphA.series[0].data[1].y = percentages[1];    
      $('#graphA').highcharts(graphA);           
    }, 

    setCutOffDate: function(days_before) {
      var date = new Date(); // Today
      return date.setDate( date.getDate() - days_before );   
    },

    // TODO tighten date adjustment to account for GMT
    // Currently the time is ignored
    convertZendeskDate: function(raw_date) {
      var date_bits = raw_date.split("T");
      var date      = date_bits[0];
      var time      = date_bits[1];
      return new Date(date);
    },

    getPercentages: function(json_data) {
      var end_users       = json_data.users;
      var count_logged_in = 0;

      for(var i = 0; i < json_data.count; i++) {
        var last_login_at = end_users[i].last_login_at;
        // Don't count users that have never logged in
        if(last_login_at == null) break;
        // Get dates to compare
        var last_login_at   = this.convertZendeskDate(last_login_at);
        var cutoff_date     = this.setCutOffDate(15);
        // Count...
        if(last_login_at >= cutoff_date) {
          count_logged_in++;
        }
      }
      // Calculate percentages
      var perc_logged_in      = (Math.round((count_logged_in / json_data.count) * 100));
      var perc_not_logged_in  = 100 - perc_logged_in;
      return [perc_logged_in, perc_not_logged_in];
    }

  };
}(jQuery));



// ------------------------------
// ------------------------------
// ------------------------------
// Runner
// ------------------------------
// ------------------------------
// ------------------------------
$(document).ready(function(){

  // Decode URL and search for string
  function getURLHashParameter(name) {
    // Reference: http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
    return decodeURIComponent((new RegExp('[#|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.hash)||[,""])[1].replace(/\+/g, '%20'))||null;
  }
  var url_access_token = getURLHashParameter("access_token");
  var url_error        = getURLHashParameter("error");

  var graph_a_datasource = null;
  var graph_b_datasource = null;
  var graph_c_datasource = null;

  if (url_access_token) {

    console.log('access_token in the URL.');
    // Set URLs for live data
    graph_a_datasource = 'https://fando.zendesk.com/api/v2/users/search.json?role=end-user';
    // Setup buttons
    $('#btnMockReports').removeClass('btn--selected');
    $('#btnLiveReports').addClass('btn--selected');

  } else {
    console.log('No access_token in URL.');

    if(url_error) {
      console.log('Error exists in URL.');
    }

    graph_a_datasource = '/js/app/mock_data/end_users.json';
    GraphA.init('/js/app/mock_data/end_users.json');
    $('#btnMockReports').addClass('btn--selected');
    $('#btnLiveReports').removeClass('btn--selected');
  }  

  // Render graphs (Mock or Live)
  var graphARequest = new APIRequest({
    url:    graph_a_datasource,
    token:  url_access_token 
  });

  graphARequest.makeAjaxRequest(function() {
    if(graphARequest.JSONresponse != null) {
      GraphA.init(graphARequest.JSONresponse);         
    } 
  });    

  // GraphB.init(data);


});