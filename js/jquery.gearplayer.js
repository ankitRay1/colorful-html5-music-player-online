
(function( $, window, document, undefined ) {
	'use strict';

  var _r, _g, _entries, // 
  ua = navigator.userAgent, // general user agent for later interrogation
  mobile = ua.match(/Mobi/i)? true : false, // as suggested here: https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
  flash = !!(navigator.mimeTypes["application/x-shockwave-flash"] || window.ActiveXObject && new ActiveXObject('ShockwaveFlash.ShockwaveFlash')),
  chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
  safari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor),
  android = ua.toLowerCase().indexOf("android") > -1,
  debug = false;  // set to true for showing console logs

  // soundManager tweaks
	if (flash && !mobile /*&& !debug*/) {  // enable flash only when supported, no mobile and not blocked
	    soundManager.flashVersion = 9;
	    soundManager.flash9Options.useWaveformData = true;
	    soundManager.flash9Options.useEQData = false; // not needed
	    soundManager.flash9Options.usePeakData = true;
	    soundManager.preferFlash = true;
      soundManager.usePolicyFile = true;
	    //soundManager.useHighPerformance = true;  // cpu intensive for this
      //soundManager.useFastPolling = true;      // same for this
	    soundManager.url = "swf/";
  	}

  // avoid displaying console logs, comment this for debugging - not needed anymore
  /*var console = {};
  console.log = function(){};*/

  // if somebody tries to run it locally, warn him with this
  if (window.location.protocol == 'file:') { alert('Whoops! You need a Webserver to run Gear Player. Get a local one here: https://www.apachefriends.org/'); }

 	// here starts the fun
	var Gear = {
		init: function( options, elem ) {
			if (debug) ( console.log('init gear player') );

			var self = this;

			self.elem = elem;
			self.$elem = $( elem );

			self.options = $.extend( {}, $.fn.gearPlayer.options, options );	// merge default options with the custom ones


			if (debug) ( console.log('options are: '+self.options.id) );

			var path = self.$elem.children('.gear').attr('data-gear');
			if (debug) ( console.log(path) );

      function parseJSON(path, deeplink){
        $.getJSON( path, function( data ) {
                
                if (debug) ( console.log('loading setup') );
                if (debug) ( console.log('deeplink? '+Gear.deeplink) ); // flag for deeplink handling
                
                if (deeplink) {
                  
                  if (data.soundcloudEnabled == undefined) { data["soundcloudEnabled"] = false; }

                  var d = $.extend( Gear.data, data ); // merge setup with deeplink json


                  if (debug) ( console.log('merged json is:'+d.albumTitle+', id: '+d.id+' soundcloud? '+d.soundcloudEnabled) );
                  Gear.create(d);

                } else {

                  if (Gear.deeplink!=null && Gear.data == null) {
                    Gear.data = data;
                    parseJSON(Gear.deeplink, true);
                  } else {
                    Gear.create(data);
                  }

                }

                
             });
      }

      parseJSON(path, false);

		},
		create: function(setup){
	    if (debug) ( console.log('initialize gear: '+setup) ); 
	    
	    Gear.setup = setup;
	    Gear.organize(setup);

	        _gConsole.soundcloudEnabled = Gear.setup.soundcloudEnabled!=undefined?Gear.setup.soundcloudEnabled:false;
	        _gConsole.soundcloudClientID = Gear.setup.soundcloudClientID!=undefined?Gear.setup.soundcloudClientID:0;

	        if (_gConsole.soundcloudEnabled) {   // check if soundcloud is enabled

	          Gear.setup.randomColors = true;
            _gConsole.soundCloudInitialized = true;

	          SC.initialize({ client_id: _gConsole.soundcloudClientID });

	          SC.get('/resolve', { url: Gear.setup.soundcloudSet }, function(playlist) {
	            
	            
	            if (setup.soundcloudOverwrite) {

	                _gConsole.albumTitle = setup.albumTitle;
	                _gConsole.albumAuthor = setup.albumAuthor;
	                _gConsole.albumCover = setup.albumCover;

	              } else {

	                _gConsole.albumTitle = playlist.title;
	                _gConsole.albumAuthor = playlist.user.username;
	                _gConsole.albumCover = playlist.artwork_url!=null? playlist.artwork_url: playlist.user.avatar_url;
	               
	              }

              _gConsole.albumUrl = playlist.permalink_url;
              _gConsole.authorUrl = playlist.user.permalink_url;


	             if (debug) ( console.log('artwork: '+playlist.permalink_url) );

	            SC.get('/playlists/'+playlist.id, function(playlist) {
	              var e = [];
	              
	              for (var i = 0; i < playlist.tracks.length; i++) {  // parse the content of the playlist
	                
	                // parse the vars to our array, the complete list is here: http://developers.soundcloud.com/docs/api/reference#tracks
	                e.push({id: playlist.tracks[i].id, 
	                        number: i, "title":playlist.tracks[i].title, 
	                        author: playlist.tracks[i].user.username, 
	                        media: playlist.tracks[i].stream_url+'?client_id='+_gConsole.soundcloudClientID, 
	                        link: playlist.tracks[i].permalink_url, 
	                        duration: playlist.tracks[i].duration, 
	                        waveform_url: playlist.tracks[i].waveform_url, 
	                        color: "#000000"});
	              }
	              
	              _entries = e.slice(0);
	              build();

	            });
	          });

	        } else {  // local json entries
	          if (debug) ( console.log('no soundcloud') );
	          
	          _gConsole.albumTitle = setup.albumTitle;
	          _gConsole.albumAuthor = setup.albumAuthor;
	          _gConsole.albumCover = setup.albumCover;
	    
	          _entries = Gear.setup.entries.slice(0);
	          build();
	        }

	        function build() {
	          
	          _gConsole.create(Gear.setup);

	          _r = Raphael(Gear.setup.id, Gear.setup.width, Gear.setup.height),
	          _g = _r.geargroup(Gear.setup.id, Gear.setup.width*.50015, Gear.setup.height*.50185, Gear.setup.outerRay, Gear.setup.innerRay, Gear.setup, $); // these weird values are used to avoid disalignments with the dragger plugin, they work well with 800 and above.

	          _gPlayer.init(Gear.setup); // check here!!!!!!!!
	          Gear.check();
	        }
	  },
	  check: function(){
	   if (debug) ( console.log('scanning for albumns') );
	    $('[data-gearPath]').each(function(){
	      
	      var obj = $(this),                    // save object in memory
	      url = obj.attr('data-gearPath');      // get the json url

	     $.getJSON( url, function(data) {       // and load it!
	       if (debug) ( console.log( "success JSON: "+data) );

          // attempt to create standard deeplink marker for each
          var deepLink = (data['albumTitle']+' - '+data['albumAuthor']).replace(/ /g,'').toLowerCase();
          obj.attr({'data-deeplink':deepLink});

	        obj.click(function() {                    // create click event

	          if (obj.hasClass('playing')) {          // check play status
	              _gPlayer.album(data, true, true);   // show album
	            } else {
	              
	              Gear.reset();
	              obj.addClass('playing');            // change status

                _gPlayer.album(data, false, true);  // create album
	           }

	        });

	      });

	    });
	  },
	  reset: function(){
	    $('[data-gearPath]').each(function(){ 
	      if ($(this).hasClass('playing')) {
	        $(this).removeClass('playing');
	      }
	    });
	  },
	  organize: function(setup){
	    var size = Object.size(Gear.options);
	    if (debug) ( console.log('fuse! '+size) );

	      for (var propName in Gear.options) {
	        if (Gear.options.hasOwnProperty(propName)) {
	          //console.log(setup[propName]);
	          
	          if (setup[propName]==undefined) {
	             if (debug) ( console.log('SETUP does not have: '+propName+' - parsing default value: '+Gear.options[propName]) );
	             Gear.setup[propName] = Gear.options[propName];
	             if (debug) ( console.log('parsed: '+Gear.setup.propName) ); 
	          }
	        }
	      }
	  
	  },
    destroy: function(){
      if (debug) ( console.log('destroying everything...') );

      // main function for clearing the whole thing
      _gConsole.clear();  // wipes out the sectors
      _gConsole.r.clear();  // wipes out the trackbar
      _gPlayer.clear(); // cleans the player
      _r.geargroup.clear(); // the main gear object
      _gInterface.clear();  // clear interface
      _gMiniPlayer.r.clear(); // clear miniplayer

      $('[data-gearPath]').each(function(){ 
          $(this).unbind("click");  // disable click events
      });

      _gConsole = _gPlayer = _g = _entries = _gMiniPlayer = _r = _gInterface = Gear = null; // clear all objects
    },
	  setup:[],
    data:null,
    deeplink:null,
    specialChars:false,
    directionRTL:false
	};


    $.fn.gearPlayer = function( options ) {
      
      // public methods

      this.refresh = function() {
        if (debug) ( console.log('called refresh') );
        Gear.check();
      }

      this.show = function() {
        if (debug) ( console.log('called show') );

        if(_gInterface !=null) { _gInterface.show(); }
      }

      this.destroy = function() {
        if (debug) ( console.log('called destroy') );
        Gear.destroy();
      }

      this.ready = function(callback) {
        if (debug) ( console.log('summoned on ready event, wait for callback...') );
        _gPlayer.onReady = callback;  // save the callback function and call it later in the routine.

         /*soundManager.onready(function(){
          setTimeout(callback, 600); // delay slightly to be safe
        });*/ 

      }

      this.play = function(n){
        n = (typeof n === "undefined") ? false : n;
        if (n) { _r.geargroup.callSector(n); }

        if (_gPlayer.sound != null && _gPlayer.sound.paused) {
          _gPlayer.togglePause();
        }
      }

      this.pause = function(){
        if (_gPlayer.sound != null && !_gPlayer.sound.paused) {
          _gPlayer.togglePause();
        }
      }

      this.volume = function(level){
          if (debug) ( console.log('set volume level to:'+level) );
          _gPlayer.setVolume(level);
      }

      this.change = function(callback) {
        _gPlayer.onChange = callback;
      }

      this.album = function(url) {

       $.getJSON( url, function(data) {       // and load it!
          if (debug) ( console.log( "success JSON: "+data) );
          _gPlayer.album(data, false, false);        // create album
          Gear.reset();
        });
      }

      this.get = function(property) { // get data from player with this function
        var p;

        switch(property) {
          case 'volume': p = _gPlayer.volume;
          break;
          case 'paused': p = _gPlayer.sound!=null ? _gPlayer.sound.paused : true;
          break;
          case 'title': p = _gConsole.albumTitle;
          break;
          case 'author': p = _gConsole.albumAuthor;
          break;
          case 'deeplink': p = _gPlayer.deeplink;
          break;
          case 'total': p = _entries.length;
          break;
          case 'current': p = _gConsole.current+1;
          break;
          case 'open': p = _gInterface.open;
          break;
          case 'entries': p = _entries;
          break;
        }

        return p;
      }

      this.loop = function(flag) {
        _gPlayer.loop = flag;
      }

      this.deeplink = function(flag) {
        Gear.deeplink = flag;
      }

      this.specialChars = function(flag) {
        Gear.specialChars = flag;
      }

      this.directionRTL = function(flag) {
        Gear.directionRTL = flag;
      }

   		return this.each(function() {
   			var gear = Object.create( Gear );
  			
  			gear.init( options, this );
  			//$.data( this, 'gearPlayer', Gear );	// not needed for now
   		});
    };

    $.fn.gearPlayer.options = {
    	"id":"gearContainer",  // this must match the id of the main container child
	    "albumCover":"/img/artwork.jpg", // the image used as artwork
	    "albumTitle":"Album Title",  // that's the displayed album title
	    "albumAuthor":"John Doe",  // and the album author
	    "soundcloudEnabled":false, // this enables Soundcloud API and the next options
	    "soundcloudClientID":"Your Soundcloud client ID", // you'll need to get your own client id on soundcloud.com
	    "soundcloudSet":"Your Soundcloud music Set", // the music set you want to parse, manage it on soundcloud.com
	    "soundcloudOverwrite":true,  // this overwrites the metadata of soundcloud, handy if you're out of control
	    "autoPlay": true,  // launches the player on start and plays the first song, doesn't work on mobile
	    "shuffle": true, // this basically mixes the order of the songs
	    "volume": 100,  // that's the starting volume, ranges from 0 to 100
	    "peak": true,  // if you want the sector to bump during playback, enable this guy here
	    "equalizer": true, // the equalizer in the middle is summoned with this option
	    "equalizerSVG":false, // supports both svg and canvas modes, keep it to false for best performance! 
	    "equalizerSize":200, // how big the equalizer should be rendered
	    "equalizerPadding":25, // the padding around the equalizer
	    "equalizerColor":"#EAEAEA",  // the color of the equalizer bars
	    "equalizerBars":128,  // from 1 to 256, the amount of available floats
	    "equalizerRatio":0.6, // from zero to one, it's the amount of space each bar is taking
	    "width": 800,  // the width of the whole player, don't make it too big or performance will be low
	    "height": 800, // same as above, you should avoid different values anyway
	    "outerRay": 140, // this value refers to the outside ray of the player
	    "innerRay": 130, // and this the part inside of it
	    "outerPadding": 50, // how much space to leave outside of the ring
	    "innerPadding": 20, // and inside of it
	    "sectorPadding": 2.5, // the spacing between the sectors
	    "trackColor":"#111111",  // it's the track color
	    "loadedColor": "#222222",  // the color of the cached amount loaded
	    "progressColor": "#EAEAEA",  // and this is the color indicating where the song plays
	    "loadedThickness": 26, // how thick the loaded ring should be
	    "progressThickness": 18, // same as above but for the progress ring
	    "timeColor":"#FFFFFF", // this colors the time text
	    "timeSize": 20,  // the size of the time text
	    "randomColors": true,  // this overwrites all sector colors and randomizes them
	    "textColor": "#FFFFFF", // that's the color of the song names around the player
	    "overColor": "#F2F2F2",  // the color when hovering
      "titleSize": 14, // the title size around the sectors
	    "authorSize": 12,  // the author size right below the title
	    "dockToRight":false // this basically docks the miniplayer to the right
    };


    var _gPlayer = {
    init: function(gSet, n) {
        //_gConsole.create(gSet);
        //TweenMax.set($('.gearWrap'), {autoAlpha:0}); // hide player on startup

        $('.gearWrap').css({'display':'none'});
        $('.stage').css({'display':'block'});

        if (Gear.directionRTL) { $('body').css('direction','rtl')};

        _gConsole.enable(gSet);
        _gPlayer.autoPlay = gSet.autoPlay;
        _gPlayer.volume = gSet.volume;
        _gConsole.shuffling = gSet.shuffle;
        _gConsole.peakEnabled = gSet.peak;

        soundManager.setup({

          onready: function() {
            if (debug) ( console.log('Sound Manager is ready and kicking!') );
            var btnDiv = document.getElementById('gearBtn');
            TweenMax.to(btnDiv, 0.5, {autoAlpha:1});
            
            _gEqualizer.ready = true;
            _gInterface.documentTitle = document.title;
            
            if (debug) ( console.log('autoplay is: '+_gPlayer.autoPlay) );

            if (_gPlayer.autoPlay == true) {

                if (Modernizr.touch && mobile) {
                    _gConsole.setStatus('pause');
                    _gConsole.showButton(0);
                    _gInterface.hide();
                } else {
                    if (debug) ( console.log('autoplaying... with shuffle? '+_gConsole.shuffling) );
                    //_r.geargroup.callSector(_gConsole.select(0));
                    _r.geargroup.callSector(0); // just call zero, it will shuffle itself later
                    _gConsole.showTime(0);
                }

                _gInterface.parseCover();

            } else {
                _gConsole.setStatus('pause');
                _gConsole.showButton(0);

                _gInterface.parseCover();
            }

            if (_gPlayer.onReady!=null && $.isFunction(_gPlayer.onReady)) { // check if it exists and is a function
            if (debug) ( console.log('Found on ready function! Lets call it...') );

            setTimeout(_gPlayer.onReady, 400);  // delay it slightly to avoid early click
            //_gPlayer.onReady();
            }

          },
          ontimeout: function() {
            if (debug) ( console.log('Sound Manager timeout!') );
          }
        });
    

        // handle keyboard interaction
        document.addEventListener("keydown", keyDown, false);
        document.addEventListener("keyup", keyUp, false);

        function keyDown(e) {
          var keyCode = e.keyCode;
          if (debug) ( console.log('Pressed: '+keyCode) );
          
          switch (keyCode) {
            case 38:
              e.preventDefault();
              if ($('.gearWrap').css('visibility')!='hidden' || _gPlayer.shift) { _gPlayer.volumeUp(); }
            break;
            case 40:
              e.preventDefault();
              if ($('.gearWrap').css('visibility')!='hidden' || _gPlayer.shift) { _gPlayer.volumeDown(); }
            break;
            case 16:
            _gPlayer.shift = true;
            break;
            case 39:
              if (_gPlayer.shift) { e.preventDefault(); }
            break;
            case 37:
              if (_gPlayer.shift) { e.preventDefault(); }
            break;
          }


        }

        function keyUp(e) {
          var keyCode = e.keyCode;
           if (debug) ( console.log('Released: '+keyCode) );

          switch(keyCode) {
            case 39:
             if ($('.gearWrap').css('visibility')!='hidden' || _gPlayer.shift) {
                e.preventDefault();
                _gPlayer.clear();
                _gPlayer.next();
              }
            break;
            case 37:
            if ($('.gearWrap').css('visibility')!='hidden' || _gPlayer.shift) {
                e.preventDefault();
               _gPlayer.clear();
               _gPlayer.prev();
              }
            break;
            case 16:
            _gPlayer.shift = false;
            break;
          }
        }

    },
    playSound: function(gSet, n) {
        
       _gConsole.current = _gConsole.ordered[n];

       var t = _gConsole.select(n);
       var media_url;

       $('#_gNumbers .current').text(("0" + Number(t+1)).slice(-2)); // update current track number
       $('#_gNumbers .total').text(("0" + Number(_entries.length)).slice(-2));

       if (_gConsole.soundcloudEnabled) {  // check if soundcloud has been enabled
          
        if (flash && !mobile) {
            _gEqualizer.useSoundCloudWave? _gPlayer.getWave(gSet, n, media_url) : _gPlayer.getSound(gSet, n, media_url);
          } else {
            media_url = _entries[t].media;
            _gPlayer.createSound(gSet, n, media_url);
          }

       } else {  // this applies for local media
          
          if (debug) ( console.log('local media policies') );
          media_url = _entries[t].media;
          _gPlayer.createSound(gSet, n, media_url);

       }

       if (_gPlayer.onChange!=null && $.isFunction(_gPlayer.onChange)) { _gPlayer.onChange('play') };
       
    },
    getWave: function(gSet, n, media_url) {
    	var t = _gConsole.select(n);
    	_gEqualizer.ready = false;

        if (debug) ( console.log('getting waveform data') );

        $.ajax({
                url: 'http://waveformjs.org/w?url='+_entries[t].waveform_url,
                dataType: 'jsonp',
                success: function(data){
                     if (debug) ( console.log('wavedata: '+data.length+'/'+_entries[t].duration) ); //wavedata

                    _gEqualizer.wave.length = 0;
                    _gEqualizer.wave = data.slice(0);
                },
                complete: function(){
                  _gPlayer.getSound(gSet, n, media_url);
                }
              });
    },
    getSound: function(gSet, n, media_url) {
    	var t = _gConsole.select(n);
    	 if (debug) ( console.log('getting sound from cloud') );
            
            $.ajax({
              url: "utils/graburl.php?client_id="+_gConsole.soundcloudClientID+"&track_id="+_entries[t].id,  // try to find out the real url to allow waveform to work properly
              dataType: 'text',
              success: function(data){  // if it finds the real url it will directly stream from there
                  if (debug) ( console.log('real url is: '+data+' normal url is: '+_entries[t].media) );
                  media_url = data;
                  _gPlayer.createSound(gSet, n, media_url);
              },
              error: function() { // if no real url is found it will use as fallback the normal streaming link
                  if (debug) ( console.log('error loading url') );
                  media_url = _entries[t].media;
                  _gPlayer.createSound(gSet, n, media_url);
              },
              complete: function() {
                _gEqualizer.ready = true;
              }
            });
    },
    createSound: function(gSet, n, media_url) {
        
      if (debug) ( console.log('summoning track number: '+n) );
       _gConsole.current = _gConsole.ordered[n];

       var t = _gConsole.select(n);
       
        if (debug) ( console.log('selected is: '+t) );
       
        if (debug) ( console.log('current is set to: '+_gConsole.current) );
        if (debug) ( console.log('order is: '+_gConsole.shuffled) );
        if (debug) ( console.log('playing: '+_entries[t].title) );


         TweenMax.to($('#gearMiniLabel'), 0.2, {width:0, onComplete: function(){
          if ($('.gearWrap').css('visibility')=='hidden') { 
          	$('.gearMini').hasClass('right') ? TweenMax.to($('#gearMiniPlayer'),0.5, {right:0}) : TweenMax.to($('#gearMiniPlayer'),0.5, {left:0});
          }
          
          // apply new title to the mini player
          $('#gearMiniTitle').html(_entries[t].title);
          $('#gearMiniAuthor').html(_entries[t].author);

          $('#gearMiniTitle, #gearMiniAuthor').css({'width':'auto'});

          // and store title and author as string for later call
          _gInterface.musicTitle = '♪ '+_entries[t].title+' — '+_entries[t].author;
          _gInterface.title();

         }});
       

       if (_gPlayer.sound!=null) { 
            _gConsole.clear();
            _gPlayer.clear();
        } else {
          _gInterface.showNumbers();
        }
        
          if (debug)( console.log('media link: '+media_url) );
          
          _gPlayer.sound = soundManager.createSound({
                id: 'currentSound',
                url: media_url,
                autoLoad: true,
                autoPlay: true,
                volume: _gPlayer.volume,
                whileloading: function() {
                 _gConsole.setLoaded(this.bytesLoaded, this.bytesTotal, _gConsole.ray);
                 _gPlayer.loaded = false;
               },
               onbufferchange: function(){
                  //if (this.isBuffering) { _gConsole.setStatus("loading"); } // leave this alone for now
               },
               onplay: function(){
                  this.isHTML5? _gConsole.peakEnabled = false: _gConsole.peakEnabled=true;

                  _gConsole.setStatus("play");
                  _gConsole.clicked = false;
                  _r.geargroup.fixArc(t);
               },
               onpause: function(){
                  _gConsole.setStatus("pause");
               },
               onresume: function(){
                  _gConsole.setStatus("play");
               },
               onload: function() {
                   _gPlayer.loaded = true;
               },
               whileplaying: function() {

                  if (!_gPlayer.sound.paused && $('.gearWrap').css('visibility')!='hidden') {

                    _gPlayer.position = this.position;
                    _gPlayer.duration = gSet.soundCloudEnabled ? _entries[t].duration : this.duration;

                    if (!_gPlayer.interacting) {
                    _gConsole.setTime(_gPlayer.getTime(this.position, true));
                    _gConsole.setProgress(this.position, _gPlayer.loaded ? this.duration : this.durationEstimate, _gConsole.ray);
                    }

                    if (gSet.equalizer && flash && !_gEqualizer.useSoundCloudWave && !mobile && !this.isHTML5 && _gPlayer.volume>0) {
                      //if (debug) {console.log('waveformdata is: '+this.waveformData.right)}
                        _gEqualizer.update(this.waveformData.left); 
                      } else { 
                        if (_gEqualizer.useSoundCloudWave && gSet.equalizer) { _gEqualizer.update( _gEqualizer.waveform() ) };
                    }

                    if (gSet.peak && flash && !_gEqualizer.useSoundCloudWave && !mobile && !this.isHTML5 && _gPlayer.volume>0) {  
                        _r.geargroup.updatePeak(t, this.peakData.left) 
                      } else { 
                        if (_gEqualizer.useSoundCloudWave && gSet.peak) { _r.geargroup.updatePeak( t, _gEqualizer.peak() ) };
                    }

                  } else {
                    _gPlayer.position = this.position;
                    _gMiniPlayer.update(this.position,_gPlayer.loaded ? this.duration : this.durationEstimate);
                  }
                  
               },
               onfinish: function() {
                     this.destruct();
                     _gPlayer.next();
               },
               ontimeout: function(status) {
                  if (debug)( console.log('timeout error: '+status.error.type) );
               }

              });
    },
    idle: function() {
      if (debug)( console.log('idle timer!') );

      _gPlayer.sound.paused?_gConsole.setStatus("pause"): _gConsole.setStatus("play");
      _gConsole.showTime(0.25);

      var limit = Math.floor(_gPlayer.sound.position);
      var total = Math.floor(_gPlayer.loaded ? _gPlayer.sound.duration : _gPlayer.sound.durationEstimate);

      if (debug)( console.log('values: '+limit+'/'+total) );

      _gConsole.progress.stop().animate({arc: [limit/total, total/total, _gConsole.ray, "progress"]}, 600, "easeInOut", function(){ _gPlayer.interacting = false; });
      _gMiniPlayer.update(limit/total,total/total);

      //_gConsole.progress.animate({arc: [_gPlayer.sound.position, _gPlayer.loaded ? _gPlayer.sound.duration : _gPlayer.sound.durationEstimate, _gConsole.ray, "progress"]}, 20000, "easeOut");
    },
    volumeUp: function(){
      if (_gPlayer.sound !=null) {
        _gPlayer.interacting = true;
        _gPlayer.volume < 100 ? _gPlayer.setVolume(_gPlayer.volume+10) : _gPlayer.setVolume(100);
         
         _gConsole.setStatus("volume");
         _gConsole.setProgress(_gPlayer.volume, 100, _gConsole.ray);

         clearTimeout(_gConsole.timer);
         _gConsole.timer = setTimeout(_gPlayer.idle, 2000);
         //setTimeout(function(){ _gPlayer.interacting = false; }, 2000);
      }
    },
    volumeDown: function() {
      if (_gPlayer.sound !=null) {
        _gPlayer.interacting = true;
        _gPlayer.volume > 0 ? _gPlayer.setVolume(_gPlayer.volume-10) : _gPlayer.setVolume(0);

        _gConsole.setStatus("volume");
        _gConsole.setProgress(_gPlayer.volume, 100, _gConsole.ray);

        clearTimeout(_gConsole.timer);
         _gConsole.timer = setTimeout(_gPlayer.idle, 2000);
      }
      //setTimeout(function(){ _gPlayer.interacting = false; }, 2000);
    },
    setVolume: function(level) {
      
      if (_gPlayer.sound!=null) { _gPlayer.sound.setVolume(level); }
      _gPlayer.volume = level;
      if (debug)( console.log('volume set to: '+level) );
    },
    setPosition: function(p) {
        soundManager.setPosition('currentSound',(_gPlayer.sound.duration*p)/100);
        _gConsole.setProgress(_gPlayer.sound.position, _gPlayer.loaded ? _gPlayer.sound.duration : _gPlayer.sound.durationEstimate, _gConsole.ray); // this one is needed when the player is paused
    },
    clear: function() {
        if (_gPlayer.sound!=null) { _gPlayer.sound.destruct() };
    },
    getTime: function(nMSec, bAsString) {
    // convert milliseconds to mm:ss, return as object literal or string
    var nSec = Math.floor(nMSec/1000),
        min = Math.floor(nSec/60),
        sec = nSec-(min*60);
    // if (min === 0 && sec === 0) return null; // return 0:00 as null
    return (bAsString?(min+':'+(sec<10?'0'+sec:sec)):{'min':min,'sec':sec});
    },
    togglePause: function() {

          if (_gPlayer.sound != null)  {
                _gPlayer.sound.togglePause();
           } else {
                _r.geargroup.callSector(0); // launch the first sector when idle
                _gConsole.showConsole(); // this fixes a glitch showing a zero level arc on webkit
           }

           if (!_gPlayer.touched && mobile) {_gPlayer.touched = true};

        //document.getElementById('debug').innerHTML = "is paused?  "+_gPlayer.sound.paused+" is playing?  "+_gPlayer.sound.playState;
        //_gPlayer.togglePause();
    },
    next: function(){

        if (_gConsole.current<_entries.length-1) {    // works!
            _r.geargroup.callSector(_gConsole.current+1);
        } else {

            if (_gPlayer.onChange!=null && $.isFunction(_gPlayer.onChange)) { _gPlayer.onChange('end') };

            if (_gPlayer.loop) { _r.geargroup.callSector(0); };
        }
    },
    prev: function(){
        if (_gConsole.current == 0){
            //_gPlayer.playSound(gSet, gSet._entries.length);
            _r.geargroup.callSector(_entries.length-1);
        } else {
            //_gPlayer.playSound(gSet, n-1);
            _r.geargroup.callSector(_gConsole.current-1);
        }
    },
    album: function(a, loaded, clicked) {

      //console.log('attempt to remove existing elements and load new ones');
      //console.log('gathered new album: '+a.albumTitle+', existing album is:'+_gConsole.albumTitle);

      function build() {
        if (debug)( console.log('called build function') );
        _gConsole.pointers(_entries);
        _r.geargroup.build(_entries, a.autoPlay);
        if (clicked) { _gInterface.show() };
        _gInterface.parseCover();
      }


      if (!loaded) { // check if it's already loaded
        $('[data-gearPlaylist]').each(function(){
        if ($(this).hasClass('playing')) {
          $(this).removeClass('playing');
          }
         });
      
        _gConsole.clear();
        _gPlayer.clear();

        _r.geargroup.clear();

        //_entries = a._entries.slice(0);

        _gConsole.soundcloudClientID = a.soundcloudClientID!=undefined ? a.soundcloudClientID : 0;
        _gConsole.soundcloudEnabled = a.soundcloudEnabled!=undefined ? a.soundcloudEnabled : false;
        _gConsole.soundcloudSet = a.soundcloudSet!=undefined ? a.soundcloudSet : 0;

        if (_gConsole.shuffling!=a.shuffle) {
          _gConsole.toggleShuffle();
          _gConsole.shuffling = a.shuffle;
        }

        if (_gConsole.soundcloudEnabled)  {
          if (debug)( console.log('soundcloud is enabled') );

          if (!_gConsole.soundCloudInitialized) { 
            SC.initialize({ client_id: _gConsole.soundcloudClientID }); 
            _gConsole.soundCloudInitialized = true;
          };
          

        SC.get('/resolve', { url: _gConsole.soundcloudSet }, function(playlist) {
              
              if (debug)( console.log('soundcloud resolved with: '+playlist) );

              if (a.soundcloudOverwrite) {

                  _gConsole.albumTitle = a.albumTitle;
                  _gConsole.albumAuthor = a.albumAuthor;
                  _gConsole.albumCover = a.albumCover;

                } else {

                  _gConsole.albumTitle = playlist.title;
                  _gConsole.albumAuthor = playlist.user.username;
                  _gConsole.albumCover = playlist.artwork_url!=null? playlist.artwork_url: playlist.user.avatar_url;

                }

                _gConsole.albumUrl = playlist.permalink_url;
                _gConsole.authorUrl = playlist.user.permalink_url;


              SC.get('/playlists/'+playlist.id, function(playlist) {
                var e = [];
                
                for (var i = 0; i < playlist.tracks.length; i++) {  // parse the content of the playlist
                  e.push({"id": playlist.tracks[i].id, 
                          "number":i, "title":playlist.tracks[i].title, 
                          "author":playlist.tracks[i].user.username, 
                          "media":playlist.tracks[i].stream_url+'?client_id='+_gConsole.soundcloudClientID, 
                          "link":playlist.tracks[i].permalink_url, 
                          "duration": playlist.tracks[i].duration, 
                          "waveform_url": playlist.tracks[i].waveform_url, 
                          "color":"#000000"});
                }
                
                _entries = e.slice(0);
                build();

              });
            });
        } else {

          _gConsole.albumTitle = a.albumTitle;
          _gConsole.albumAuthor = a.albumAuthor;
          _gConsole.albumCover = a.albumCover;
          _gConsole.albumUrl = null;
          _gConsole.authorUrl = null;

          _entries = a.entries.slice(0);
          build();
        }
          
      } else {  // it's already loaded, so let's just show the gui at once!
        if (debug)( console.log('current album already loaded!!! calling show function...') );
        if (clicked) { _gInterface.show() };
      }

      _gPlayer.deeplink = $('.playing').attr('data-deeplink');

      if (_gPlayer.onChange!=null && $.isFunction(_gPlayer.onChange)) { _gPlayer.onChange('album') };
      
    },
    onReady:null,
    onChange:null,
    autoPlay:false,
    loop:true,
    deeplink:null,
    sound:null,
    scrubbing:false,
    loaded:false,
    interacting:false,
    volume:0,
    duration:0,
    position:0,
    touched:false,
    shift:false
}






// minimal player, docked when closed
var _gMiniPlayer = {
  create: function(gSet){
    var thickness = 10;
    var size = 40;
    var ray = (size*.5)-(thickness);

    _gMiniPlayer.ray = ray;

        var miniDiv = document.createElement('div');
        miniDiv.id = 'gearMiniPlayer';
        miniDiv.className = 'gearMini';

		document.getElementById(gSet.id).parentNode.parentNode.appendChild(miniDiv);
		
		if (gSet.dockToRight) { 
        	miniDiv.className += ' right'; 
        	$('.gearMini').css({'right':'-80px', 'left':'auto'}); 
        } else {
        	$('.gearMini').css({'left':'-80px', 'right':'auto'}); 
        }

        miniDiv.onclick = function() { if (debug)( console.log('clicked miniplayer') ); _gInterface.show(); }

        $('#gearMiniPlayer').hover(
          function(){
            var t = $('#gearMiniTitle').width(),
                a = $('#gearMiniAuthor').width(),
                w = t>a?t:a;

            if (debug)( console.log('hovering: '+w) );
            if ($('#gearMiniLabel>.gearTitle').html().trim() && !mobile) { TweenMax.to($('#gearMiniLabel'), 0.5, {width:Math.floor(w+40)+'px'}) };
          },
          function(){
            TweenMax.to($('#gearMiniLabel'), 0.5, {width:0});
          });


        //if (!gSet.autoPlay) { miniDiv.style.display = 'none'}; // hide when not autoplaying? uhm.

        var circleDiv = document.createElement('span');
        circleDiv.id = 'gearMiniCircle';
        circleDiv.className = 'gearCircle';
        //circleDiv.className += ' has-tip';
        //circleDiv.className += ' tip-right';
        document.getElementById(miniDiv.id).appendChild(circleDiv);
        //$('#'+miniDiv.id+' span').attr({'title':_entries[0].author+' &ndash; '+_entries[0].title, 'data-tooltip':'right', 'data-options':'disable_for_touch:true'});


        var labelDiv = document.createElement('div');
        labelDiv.id = 'gearMiniLabel';
        labelDiv.className = 'gearLabel';
        document.getElementById(miniDiv.id).appendChild(labelDiv);


        var titleSpan = document.createElement('span');
        titleSpan.id = 'gearMiniTitle';
        titleSpan.className = 'gearTitle';
        document.getElementById(labelDiv.id).appendChild(titleSpan);


        var authorSpan = document.createElement('span');
        authorSpan.id = 'gearMiniAuthor';
        authorSpan.className = 'gearAuthor';
        document.getElementById(labelDiv.id).appendChild(authorSpan);


        var c =  Raphael(circleDiv.id, size, size),
        s = c.set();

        c.circle(size*.5, size*.5, ray).attr({"stroke":"#FFFFFF", "stroke-width":thickness, "fill":"none","opacity":0.2})
            
        c.customAttributes.arc = function (value, total, R, type) {
                    var alpha = 360 / total * value,
                        d = size*.5,
                        a = (90 - alpha) * Math.PI / 180,
                        x = d + R * Math.cos(a),
                        y = d - R * Math.sin(a),
                        path;

                    if (total == value) {
                        path = [["M", d, d - R], ["A", R, R, 0, 1, 1, d-0.01, d - R]];
                    } else {
                        path = [["M", d, d - R], ["A", R, R, 0, +(alpha > 180), 1, x, y]];
                    }
                    return {path: path};
                };

        var ringParam = {stroke: gSet.progressColor, /*"stroke-linecap": "round", */"stroke-width": thickness};
        _gMiniPlayer.ring = c.path().attr(ringParam).attr({arc: [0, 100, ray]});

        _gMiniPlayer.r = c;

  },
  update: function(level, total){
    //_gMiniPlayer.ring.stop().animate({arc: [level, total, _gMiniPlayer.ray, "progress"]}, 100, "easeOut");  // takes 20% of cpu, not good
    TweenMax.set(_gMiniPlayer.ring,{raphael:{arc:[level, total, _gMiniPlayer.ray, "progress"]}}); // takes 2% of cpu, good
    //$('#gearMiniTime').text(_gPlayer.getTime(_gPlayer.position, true));
  },
  r:null,
  ring:null,
  ray:0
}

// the console
var _gConsole = {
    create: function(gSet) {

        _gInterface.create(gSet); // the graphics interface
        
        if (flash && gSet.equalizer && !mobile) { _gEqualizer.create(gSet); } // element is on the dom, launch the function
        
        gSet.peak? _gEqualizer.usePeak = true: _gEqualizer.usePeak = false;
        gSet.equalizer? _gEqualizer.useWave = true : _gEqualizer.useWave = false;
        

        // group all inside the console
        var consoleDiv = document.createElement('div');
        consoleDiv.id = '_gConsole';
        consoleDiv.className = 'gear';
        document.getElementById(gSet.id).parentNode.appendChild(consoleDiv);

        // create the track
        var trackDiv = document.createElement('div');
        trackDiv.id = 'gearTrack';
        trackDiv.className = 'gear';
        trackDiv.className += " " + 'rounded';
        document.getElementById(consoleDiv.id).appendChild(trackDiv);


        // create button holder
        var btnDiv = document.createElement('div');
        btnDiv.id = "gearBtn";
        btnDiv.className = "btn";
        document.getElementById(consoleDiv.id).appendChild(btnDiv);

        /*var btnSpan = document.createElement('span');
        btnSpan.className = "btn";
        document.getElementById(btnDiv.id).appendChild(btnSpan);*/

        // create time counter
        var timeDiv = document.createElement('div');
        timeDiv.id = "gearTime";
        timeDiv.className = "time";
        timeDiv.innerHTML = "0:00";
        document.getElementById(btnDiv.id).appendChild(timeDiv);


        // create play button
        var playDiv = document.createElement('div');
        playDiv.id = 'gearPlay';
        playDiv.className = 'gear';
        playDiv.className += ' play';
        document.getElementById(btnDiv.id).appendChild(playDiv);


        // manage button function
        btnDiv.onclick = function() { 
            _gPlayer.togglePause();
            //soundManager.togglePause('currentSound');
        }

        _gConsole.shuffling = gSet.shuffle;
        _gConsole.shuffling? TweenMax.set($('#_gShuffle'), {alpha:0.7}) : TweenMax.set($('#_gShuffle'), {alpha:0.3});
        //_gConsole.pointers(_entries);



        if (/*!Modernizr.touch*/ !mobile) { 

          $("#gearBtn").hover(function() { 
            if (!_gPlayer.scrubbing) { 
              _gConsole.showButton(0.3)
              _gConsole.over = true;
            };  }, 

            function() { if(!_gPlayer.scrubbing) {
              _gConsole.showTime(0.3)}; 
              _gConsole.over = false;
            }); 
          }  // swaps time and play button on mouse hover
        

        var area = document.getElementById(gSet.id).parentNode;


        _gConsole.ray = gSet.innerRay-gSet.innerPadding;  // used to speed up calculations
        
        var consoleSize = (gSet.innerRay*2),
            c = Raphael("_gConsole", consoleSize, consoleSize),
            s = c.set(),
            t = c.circle(consoleSize*.5, consoleSize*.5, gSet.innerRay-gSet.innerPadding).attr({"stroke":gSet.trackColor, "stroke-width":gSet.loadedThickness*0, "fill":"none","opacity":1})
            
            c.customAttributes.arc = function (value, total, R, type) {
                    var alpha = 360 / total * value,
                        d = consoleSize*.5,
                        a = (90 - alpha) * Math.PI / 180,
                        x = d + R * Math.cos(a),
                        y = d - R * Math.sin(a),
                        //color = "hsb(".concat(Math.round(R) / 200, ",", value / total, ", .75)"),
                        path;

                    if (total == value) {
                        path = [["M", d, d - R], ["A", R, R, 0, 1, 1, d-0.01, d - R]];
                    } else {
                        path = [["M", d, d - R], ["A", R, R, 0, +(alpha > 180), 1, x, y]];
                    }
                    return {path: path/*, stroke: color*/};
                };

        _gConsole.r = c; // pass raphael object to local var for later call

        // adjust console position
        //var gConsole = document.getElementById('gearTrack');
        trackDiv.style.marginLeft = '-'+Math.floor(consoleSize*.5-1)+'px';
        trackDiv.style.marginTop = '-'+Math.floor(consoleSize*.5-2)+'px';
        // adjust console time size and position
        //var gTime = document.getElementById('gearTime');
        btnDiv.style.width = timeDiv.style.width = playDiv.style.width = consoleSize*.4+'px';
        btnDiv.style.height = timeDiv.style.height = playDiv.style.height = consoleSize*.4+'px';

        timeDiv.style.display = playDiv.style.display = btnDiv.style.display = "block";
        timeDiv.style.cursor = playDiv.style.cursor = btnDiv.style.cursor = "pointer";


        /*if (chrome || safari) { 
            timeDiv.style.lineHeight = Math.floor(consoleSize*.4-6)+'px';
            playDiv.style.lineHeight = Math.floor(consoleSize*.4-1)+'px';
        } else {*/
             timeDiv.style.lineHeight = Math.floor(consoleSize*.4-6)+'px';
             playDiv.style.lineHeight = Math.floor(consoleSize*.4-1)+'px';
        //}
        

        btnDiv.style.marginLeft = /*timeDiv.style.marginLeft = playDiv.style.marginLeft =*/ '-'+Math.floor(consoleSize*.2)+'px';
        btnDiv.style.marginTop = /*timeDiv.style.marginTop = playDiv.style.marginTop = */'-'+Math.floor(consoleSize*.2)+'px';

        consoleDiv.style.width = consoleDiv.style.height  = consoleSize+'px';
        consoleDiv.style.marginLeft = '-'+Math.floor(consoleSize*.5)+'px'
        consoleDiv.style.marginTop = '-'+Math.floor(consoleSize*.5-1)+'px'; 

        var loadedParam = {stroke: gSet.loadedColor, "stroke-linecap": "round", "stroke-width": gSet.loadedThickness};
        var progressParam = {stroke: gSet.progressColor, "stroke-linecap": "round", "stroke-width": gSet.progressThickness};

        var ray = gSet.innerRay-gSet.innerPadding;
        _gConsole.loaded = c.path().attr(loadedParam).attr({arc: [0, 100, ray]});
        _gConsole.progress = c.path().attr(progressParam).attr({arc: [0, 100, ray]});
        _gConsole.track = t;
 
        // hide both arcs until the player is ready
        _gConsole.loaded.attr({'opacity':0});
        _gConsole.progress.attr({'opacity':0});

        TweenMax.set(btnDiv, {autoAlpha:0});


        s.push(_gConsole.loaded);
        s.push(_gConsole.progress);

        /* Console interaction */

        // finds out the angle from a point on the circumference, that's trigonometry pal!
        function angle(center, p1) {
                var p0 = {x: center.x, y: center.y - Math.sqrt(Math.abs(p1.x - center.x) * Math.abs(p1.x - center.x)
                        + Math.abs(p1.y - center.y) * Math.abs(p1.y - center.y))};
                return (2 * Math.atan2(p1.y - p0.y, p1.x - p0.x)) * 180 / Math.PI;
            }

        // updates the arc level after interaction
        function updateArc(posX, posY) {
            var center = {x:consoleSize*.5, y: consoleSize*.5};
            var p1 = {x: posX, y: posY};

            var a = angle(center, p1);
            var p = a/360*100;
            var l = _gPlayer.sound.bytesLoaded/_gPlayer.sound.bytesTotal*100;

            if (p!=null && p>0 && p<=l) { _gPlayer.setPosition(p); };

            //soundManager.setPosition('currentSound',(mySound.duration*p)/100);    // scraping the actual sound
            //gearTrack.progress.stop().animate({arc: [p, progressTotal, ray, "progress"]}, 50, "easeOut");
        }

        // drag functions
        var cMove = function(dx, dy) {

            var posX = this.ox + dx;
            var posY = this.oy + dy;

            updateArc(posX, posY);
            _gPlayer.scrubbing = true;
        },
        cStart = function(sx, sy, event) {
            this.ox = event.offsetX || event.layerX;
            this.oy = event.offsetY || event.layerY;
        },
        cUp = function() {
            _gPlayer.scrubbing = false;
        }

        if (/*!Modernizr.touch*/ !mobile) { s.drag(cMove, cStart, cUp); } // build the drag only for non touch devices!
        

        function setLevel(event) {
            event = event || window.event;                      // normalize event
            var touch = /*Modernizr.touch || */mobile?event.touches[0]:event; // this one is needed for mobile devices

  
            // find out the coordinates of the click or touch event
            var posX = event.offsetX || event.layerX<0? touch.pageX- $(document).scrollLeft() - $('#_gConsole').offset().left: event.layerX;
            var posY = event.offsetY || event.layerY<0? touch.pageY- $(document).scrollTop()- $('#_gConsole').offset().top: event.layerY;

            // apply new coordinates
            updateArc(posX, posY);

            //var touch = event.touches[0];
            //var x = event.pageX - $(document).scrollLeft() - $('#_gConsole').offset().left;

            //document.getElementById('debug').innerHTML = "pos: "+posX+'/'+posY+'-'+event.offsetX+', '+event.layerX+', '+touch.pageX;

        }
        
        // add simple click interaction
        s.mousedown(function (event, a, b) { setLevel(event); });

        // try touch events
        s.touchstart(function(event) {
            event.preventDefault();
            setLevel(event);
            _gPlayer.scrubbing = false;

             //document.getElementById('debug').innerHTML = 'touch start';
        })

        s.touchmove(function(event){
            event.preventDefault();
            setLevel(event);
             _gPlayer.scrubbing = true;

             //document.getElementById('debug').innerHTML ='touch move';
        })

        if (android) {
          s.touchend(function(event) {
              event.preventDefault();
              setLevel(event);
              _gPlayer.scrubbing = false;

              // document.getElementById('debug').innerHTML = 'touch end';
          });

          s.touchcancel(function(event) {
              event.preventDefault();
              setLevel(event);
              _gPlayer.scrubbing = false;

              // document.getElementById('debug').innerHTML = 'touch cancel';
          });
        }
        

    },
    /*loading: function() {
        _gConsole.progress.attr({'opacity':1});
        _gConsole.progress.stop().animate({arc: [100, 100, _gConsole.ray, "progress"]}, 5000, "easeOut");
    },*/
    enable: function(gSet) {
      _gConsole.pointers(_entries);

      _gConsole.track.stop().animate({"stroke-width":gSet.loadedThickness}, 500, "easeOut");
      _gConsole.progress.stop().animate({"stroke-width":gSet.progressThickness}, 500, "easeOut");
    },
    setProgress: function(level, total, ray) {
        //document.getElementById('debug').innerHTML = 'Progress: '+level;
        //_gConsole.progress.stop().animate({arc: [level, total, ray, "progress"]}, 50, "easeOut");
        TweenMax.to(_gConsole.progress, 0.1,{raphael:{arc: [level, total, ray, "progress"]}, ease:Cubic.easeOut, overwrite:4});
    },
    setLoaded: function(level, total, ray) {
        //document.getElementById('debug').innerHTML = 'Loaded: '+level;
        if (level>_gConsole.loadedLevel) {
            //_gConsole.loaded.stop().animate({arc: [level, total, ray, "loaded"]}, 500, "easeOut");
            TweenMax.to(_gConsole.loaded, 0.5, {raphael:{arc: [level, total, ray, "loaded"]}, ease:Cubic.easeOut});
            _gConsole.loadedLevel = level;
        }
    },
    showConsole: function(p) {
        _gConsole.loaded.attr({'opacity':1});
        _gConsole.progress.attr({'opacity':1});

        TweenMax.to($('#_gConsole svg'), 0.5, {scaleX:1, scaleY:1, alpha:1, ease:Cubic.easeOut});
    },
    clear: function(){
        //document.getElementById('debug').innerHTML = 'Clear: '+_gConsole.loadedLevel;
        _gConsole.setTime(_gPlayer.getTime(0, true));
        _gConsole.loadedLevel = 0;
        //_gConsole.progress.stop().animate({arc: [0, 100, _gConsole.ray, "progress"]}, 0, "easeOut");
        //_gConsole.loaded.stop().animate({arc: [0, 100, _gConsole.ray, "loaded"]}, 0, "easeOut");
        
        TweenMax.set(_gConsole.progress, {raphael:{arc: [0, 100, _gConsole.ray, "progress"]}});
        TweenMax.set(_gConsole.loaded, {raphael:{arc: [0, 100, _gConsole.ray, "loaded"]}});

    },
    setTime: function(value) {
        //console.log(value);
        document.getElementById("gearTime").innerHTML = value;
    },
    showTime: function(n) {
        //if (!_gPlayer.scrubbing) {
            TweenMax.to($('#gearPlay'), n, {alpha:0, scaleX:0, scaleY:0, overwrite:1});
            TweenMax.to( $('#gearTime'), n, {alpha:1, scaleX:1, scaleY:1, delay:n-n*.5, overwrite:2, onStart: function(){
              //TweenMax.set($('#gearPlay'), {alpha:0, scaleX:0, scaleY:0}); // fixes fast tween glitches
              TweenMax.to($('#gearPlay'), n*.5, {alpha:0, scaleX:0, scaleY:0, overwrite:2});
            }});
        //}
    },
    showButton: function(n) {
        //if (!_gPlayer.scrubbing) {
            TweenMax.to($('#gearPlay'), n, {alpha:1,scaleX:1, scaleY:1, delay:n-n*.5, overwrite:1});
            TweenMax.to( $('#gearTime'), n, {alpha:0, scaleX:0, scaleY:0,delay:n-n, overwrite:1});
        //}
    },
    setStatus: function(e) {
        if (debug)( console.log('new status: '+e) );
        var obj = document.getElementById("gearPlay");

        switch (e) {
            case "pause":
                if (debug)( console.log('set icon to pause') );
                obj.innerHTML = '<i class="fi-play-circle size-72"></i>';

                /*TweenMax.set(obj, {scaleX:1, scaleY:1});
                TweenMax.killTweensOf(obj);*/ 
                
                _gConsole.showButton(0.3);
            break;
            case "play":
                if (debug)( console.log('set icon to play') );
                obj.innerHTML = '<i class="fi-pause size-72"></i>';

                /*TweenMax.set(obj, {scaleX:1, scaleY:1});
                TweenMax.killTweensOf(obj);*/

                if (Modernizr.touch && mobile) { _gConsole.showTime(0.3); }
            break;
            case "volume":
                if (debug)( console.log('set icon to volume') );
                _gPlayer.volume == 0? obj.innerHTML = '<i class="fi-volume-strike size-72"></i>': obj.innerHTML = '<i class="fi-volume size-72"></i>';
                _gConsole.showButton(0.3);
            break;
            case "error":
                  //document.getElementById('debug').innerHTML = "error!";
            break;
        }
    },
    shuffle: function(o) {
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    },
    showPlaylist: function(){
      if (!$('#_gPlayer').hasClass('docked') /*&& !_gPlayer.scrubbing*/ && $(window).width() < 767) { 
                var w = ($(window).width()+_gConsole.ray)*.5;
                $('#_gPlayer').addClass('docked');
                TweenMax.to($('#_gPlayer'), 0.5, {left: -w+"px", transformOrigin:"center center", ease:Cubic.easeInOut});
                TweenMax.to($('#_gPlaylist'), 0.5, {alpha: 1});
              }
    },
    hidePlaylist: function(){
      if ($('#_gPlayer').hasClass('docked') /*&& !_gPlayer.scrubbing*/ && $(window).width() < 767) { 
                $('#_gPlayer').removeClass('docked'); 
                TweenMax.to($('#_gPlayer'), 0.5, {left: 0, ease:Cubic.easeInOut});
                TweenMax.to($('#_gPlaylist'), 0.5, {alpha: 0.6});
              }
    },
    togglePlaylist: function() {
      $('#_gPlayer').hasClass('docked')? _gConsole.hidePlaylist(): _gConsole.showPlaylist();
    },
    toggleShuffle: function(){
      if (debug)( console.log('toggling shuffle') );

      if (_gConsole.shuffling) {
          _gConsole.shuffling = false;
          TweenMax.to($('#_gShuffle'), 0.5, {alpha:0.3});
        } else {
          _gConsole.shuffling = true;
          TweenMax.to($('#_gShuffle'), 0.8, {alpha:0.7});
      }
    },
    pointers: function(e) {
       for (var i = 0, len = e.length; i < len; i++) {  _gConsole.ordered.push(i); }

       _gConsole.shuffled = _gConsole.ordered.slice(0); // duplicate ordered array
       _gConsole.shuffle(_gConsole.shuffled);           // and shuffle it

       if (debug)( console.log('ordered is: '+_gConsole.ordered) );
       if (debug)( console.log('shuffled is: '+_gConsole.shuffled) );
    },
    select: function (n) {
        var t = 0;
        //console.log('selecting.')

        if (_gConsole.shuffling && !_gConsole.clicked) {
          t = _gConsole.shuffled[n];
        } else {
          t = _gConsole.ordered[n];
        }

        return t;
    },
    r:null, 
    track: null,
    progress: null,
    loaded: null,
    loadedLevel:0,
    ray:0,
    current:0,
    ordered:[],
    shuffled:[],
    shuffling:false,
    peakEnabled:false,
    album:[],
    albumTitle:null,
    albumAuthor:null,
    albumCover:null,
    albumUrl:null,
    authorUrl:null,
    soundcloudEnabled:false,
    soundcloudClientID:0,
    soundcloudSet:0,
    soundCloudInitialized:false,
    clicked:false,
    rotating:false,
    timer: null,
    over: false
}


// graphics user interface

var _gInterface = {
  create: function(gSet){

        _gMiniPlayer.create(gSet);

        $('#'+gSet.id).wrap("<div id='_gPlayer' class='player'></div>");

        // group all inside the main div
        var guiDiv = document.createElement('div');
        guiDiv.id = '_gInterface';
        guiDiv.className = 'interface';

        //var parent = document.getElementById(gSet.id).parentNode.parentNode;
        //parent.insertBefore(guiDiv, parent.firstChild);

        //document.getElementById(gSet.id).parentNode.parentNode.appendChild(guiDiv);


        // overlaying div
        var overDiv = document.createElement('div');
        overDiv.id = '_gOverlay';
        overDiv.className = 'overlay';

        //document.getElementById(guiDiv.id).appendChild(overDiv);
        document.getElementById(gSet.id).parentNode.parentNode.appendChild(overDiv);

        var p = document.getElementById(gSet.id).parentNode.parentNode;
        p.insertBefore(overDiv, p.firstChild);



        // album art and title
        var albumDiv = document.createElement('div');
        albumDiv.id = '_gAlbum';
        albumDiv.className = 'album';

        document.getElementById(gSet.id).parentNode.parentNode.appendChild(albumDiv);

        _gInterface.albumCover = document.createElement('div');
        _gInterface.albumCover.id = '_gAlbumCover';
        _gInterface.albumCover.className = 'cover';

        document.getElementById(albumDiv.id).appendChild(_gInterface.albumCover);

        //_gInterface.parseCover(_gConsole.albumCover); // loads and creates the image on runtime


        var albumGroup = document.createElement('div'); // needed for wrapping
        albumGroup.id = '_gAlbumGroup';
        albumGroup.className = 'albumgroup';
        document.getElementById(albumDiv.id).appendChild(albumGroup);

       
        _gInterface.albumTitle = document.createElement('span');
        _gInterface.albumTitle.id = '_gAlbumTitle';
        _gInterface.albumTitle.className = 'title';

        document.getElementById(albumGroup.id).appendChild(_gInterface.albumTitle);
        //_gInterface.albumTitle.innerHTML = _gConsole.albumTitle;

        _gInterface.albumAuthor = document.createElement('span');
        _gInterface.albumAuthor.id = '_gAlbumAuthor';
        _gInterface.albumAuthor.className = 'author';

        document.getElementById(albumGroup.id).appendChild(_gInterface.albumAuthor);
        //_gInterface.albumAuthor.innerHTML = _gConsole.albumAuthor;   
     


        // current, total label
        var currentDiv = document.createElement('div');
        currentDiv.id = '_gCurrent';
        currentDiv.className = 'currentGroup';

        //currentDiv.className = 'hide-for-small-only';
        //document.getElementById(guiDiv.id).appendChild(currentDiv);
        document.getElementById(gSet.id).parentNode.parentNode.appendChild(currentDiv);

            // add raphael diagonal line
            var p = Raphael("_gCurrent", _gInterface.linesize, _gInterface.linesize);
            _gInterface.line = p.path( "M0,0 L0,0").attr({"stroke": "#ffffff", "opacity":0.3});

            var numDiv = document.createElement('div');
            numDiv.id = "_gNumbers";
            numDiv.className = 'numbers';
            document.getElementById(currentDiv.id).appendChild(numDiv);

            _gInterface.c = document.createElement('span');
            _gInterface.c.className = 'current';
            _gInterface.c.style.opacity = 0;
            document.getElementById(numDiv.id).appendChild(_gInterface.c);
            _gInterface.c.innerHTML = '0';

            _gInterface.t = document.createElement('span');
            _gInterface.t.className = 'total';
            _gInterface.t.style.opacity = 0;
            document.getElementById(numDiv.id).appendChild(_gInterface.t);
            _gInterface.t.innerHTML = '0';



        //_gInterface.parseCover(); // loads and creates the image on runtime


        // playlist div
        var playlistDiv = document.createElement('div');
        playlistDiv.id = '_gPlaylist';
        playlistDiv.className = 'playlist';
        //playlistDiv.className += ' hide-for-medium-up'

        document.getElementById(gSet.id).parentNode.parentNode.appendChild(playlistDiv);
        playlistDiv.innerHTML = '<i class="fi-list-thumbnails"></i>';


        playlistDiv.onclick = function() {  
          _gConsole.togglePlaylist();
        }

        // closing div
        var closeDiv = document.createElement('div');
        closeDiv.id = '_gClose';
        closeDiv.className = 'close';
        closeDiv.style.opacity = 0.7;

        //document.getElementById(guiDiv.id).appendChild(closeDiv);
        document.getElementById(gSet.id).parentNode.parentNode.appendChild(closeDiv);
        closeDiv.innerHTML = '<i class="fi-x-circle"></i>';

        closeDiv.onclick = function() {
          _gInterface.hide();
        }


        $('#_gClose').hover(function(){
          TweenMax.to($(this), 0.5, {alpha:1});
        }, function(){
          TweenMax.to($(this), 0.5, {alpha:0.7});
        })


        // shuffle div
        var shuffleDiv = document.createElement('div');
        shuffleDiv.id = '_gShuffle';
        shuffleDiv.className = 'shuffle';

        //document.getElementById(guiDiv.id).appendChild(shuffleDiv);
        document.getElementById(gSet.id).parentNode.parentNode.appendChild(shuffleDiv);
        shuffleDiv.innerHTML = '<i class="fi-shuffle"></i>';

        shuffleDiv.onclick = function() {
          _gConsole.toggleShuffle();
        }

        $('#_gShuffle').hover(function(){
          TweenMax.to($(this), 0.5, {alpha:1});
        }, function(){
          _gConsole.shuffling? TweenMax.to($(this),0.5, {alpha:0.7}) : TweenMax.to($(this),0.5, {alpha:0.3});
        });

  },
  showNumbers: function(){
    _gInterface.line.animate({path:"M0,0 L"+_gInterface.linesize+","+_gInterface.linesize}, 500, "easeOut");
    TweenMax.to(_gInterface.c, 0.5,{alpha:1});
    TweenMax.to(_gInterface.t, 0.5,{alpha:0.5});
  },
  parseCover: function(){
    var img = _gConsole.albumCover;

    $('#_gAlbumAuthor, #_gAlbumTitle').css({'display':'none', 'width':'auto'});
    $('#_gAlbumCover').empty();  // clean up the container
    
    _gInterface.albumAuthor.innerHTML = _gConsole.authorUrl!=null ? '<a href="'+_gConsole.authorUrl+'" target="_blank">'+_gConsole.albumAuthor+'</a>' : _gConsole.albumAuthor;
    _gInterface.albumTitle.innerHTML = _gConsole.albumUrl!=null ? '<a href="'+_gConsole.albumUrl+'" target="_blank">'+_gConsole.albumTitle+'</a>' : _gConsole.albumTitle;

     var queue = new createjs.LoadQueue(true);
        queue.loadFile({src: img, type: createjs.LoadQueue.IMAGE});
        queue.on("fileload", handleFileLoad, this);
        queue.on("complete", handleComplete, this);
        queue.load();

        function handleFileLoad(event) {
             var item = event.item; // A reference to the item that was passed in to the LoadQueue
             var type = item.type;

             // Add any images to the page body.
             if (type == createjs.LoadQueue.IMAGE) {

                document.getElementById(_gInterface.albumCover.id).appendChild(event.result);
                TweenMax.set($('#_gAlbumCover'), {alpha:0});
                //document.body.appendChild(event.result);
             }
         }

        function handleComplete(event) {
          if (debug)( console.log('cover loaded') );
          TweenMax.to($('#_gAlbumCover'), 0.5, {alpha:1, onComplete: function(){
            $('#_gAlbumAuthor, #_gAlbumTitle').css({'display':'block'});
            TweenMax.from($('#_gAlbumAuthor'), 0.5, {width: 0, delay: 0.2, ease:Cubic.easeOut});
            TweenMax.from($('#_gAlbumTitle'), 0.5, {width: 0/*, delay:0.2*/, ease:Cubic.easeOut});

          }});
          
          //_gInterface.albumCover.innerHTML = '<img src="'+_gConsole.albumCover+'">';
        }
  },
  hide: function(){

    TweenMax.to($('.gearWrap'), 0.5, {autoAlpha:0, onComplete: function(){
      $('.gearMini').hasClass('right') ? TweenMax.to($('.gearMini'), 0.5, {right:0}) : TweenMax.to($('.gearMini'), 0.5, {left:0});
      $('.gearWrap').css({'display':'none'});
    }});
    
    _gInterface.enableScroll();
    _gInterface.open = false;
    _gInterface.title();

    if (_gPlayer.onChange!=null && $.isFunction(_gPlayer.onChange)) { _gPlayer.onChange('hide') };
  },
  show: function(){
  	
    if (!_gInterface.open || $('.stage').css('display')=='none') {  //double flag whenever one fails
      if (debug)( console.log('show interface') );

      _gInterface.open = true;
      _gInterface.documentTitle = document.title;
      
      _gInterface.title();

      //_gInterface.parseCover();

      _gInterface.disableScroll();

      TweenMax.to($('#gearMiniLabel'), 0.2, {width:0, 
        onStart: function() { $('.gearWrap').css({'display':'block'})},
        onComplete: function(){  // hide the miniplayer

        TweenMax.to($('.gearWrap'), 0.5, {autoAlpha:1});
        $('.gearMini').hasClass('right') ? TweenMax.to($('.gearMini'), 0.5, {right: '-'+$('.gearMini').width()*2+'px'}) : TweenMax.to($('.gearMini'), 0.5, {left:'-'+$('.gearMini').width()*2+'px'});
        TweenMax.from($('#_gPlayer'), 0.5,{scaleX:0.5, scaleY:0.5});

      }});

      if (_gPlayer.onChange!=null && $.isFunction(_gPlayer.onChange)) { _gPlayer.onChange('show') };
    }
    
  },
  disableScroll: function(){
    if (window.addEventListener) {
      window.addEventListener('DOMMouseScroll', _gInterface.wheel, false);
      }
      window.onmousewheel = document.onmousewheel = _gInterface.wheel;
      document.onkeydown = _gInterface.keydown;

      $('body').bind('touchmove', function(e){e.preventDefault()});
      
      _gInterface.y = $(window).scrollTop();
      $('.stage').css({'display':'none'}); // hide the whole chunk, gains some cpu power

  },
  enableScroll: function(){
    if (window.removeEventListener) {
        window.removeEventListener('DOMMouseScroll', _gInterface.wheel, false);
    }
    window.onmousewheel = document.onmousewheel = document.onkeydown = null;  

    $('body').unbind('touchmove');
    
    $('.stage').css({'display':'block'});
    window.scrollTo(0, _gInterface.y);

  },
  keydown: function(e){
    for (var i = _gInterface.keys.length; i--;) {
        if (e.keyCode === _gInterface.keys[i]) {
            _gInterface.prevent(e);
            return;
        }
    }
  },
  wheel: function(e){
    _gInterface.prevent(e);
  },
  prevent: function(e) {
    e = e || window.event;
    if (e.preventDefault)
        e.preventDefault();
    e.returnValue = false;  
  },
  clear: function() {
    _gInterface.hide(); // 
    Draggable.get("#gearContainer").kill(); // disable greensock component
    $('.gearWrap, .gearMini').remove();  // remove players
  },
  title: function() {
    if (_gInterface.open) {
      document.title = _gInterface.musicTitle;
    } else {
      document.title = _gInterface.documentTitle;
    }
  },
  keys:[37, 38, 39, 40], line:null, linesize:100, c:null, t:null, albumTitle:null, albumAuthor:null, albumCover:null, albumUrl:null, authorUrl:null, open:false, y:0, documentTitle:null, musicTitle:null
}





// equalizer

var _gEqualizer = {
  create: function(gSet){
    //console.log('building equalizer');
  
    // create the equalizer
    var equalizerDiv = document.createElement('div');
    equalizerDiv.id = '_gEqualizer';
    equalizerDiv.className = 'gear';

    var parent = document.getElementById(gSet.id).parentNode;
    parent.insertBefore(equalizerDiv, parent.firstChild);

    var equalizerSize = gSet.equalizerSize;
    var equalizerPadding = gSet.equalizerPadding;
    equalizerDiv.style.marginLeft = '-'+(equalizerSize*.5)+'px';
    equalizerDiv.style.marginTop = '-'+(equalizerSize*.5)+'px';
    equalizerDiv.style.width = equalizerDiv.style.height = equalizerSize+'px';


    // parse all vars
    _gEqualizer.svg = gSet.equalizerSVG;
    _gEqualizer.n = gSet.equalizerBars;
    _gEqualizer.r = equalizerSize*.5-gSet.equalizerPadding;
    _gEqualizer.w = gSet.equalizerPadding;
    _gEqualizer.cx = equalizerSize*.5;
    _gEqualizer.cy = equalizerSize*.5;
    _gEqualizer.clr = gSet.equalizerColor;
    _gEqualizer.ratio = gSet.equalizerRatio;

      // let's go canvas

      var equalizerCanvas = document.createElement('canvas');
      equalizerCanvas.id = 'eqCanvas';
      equalizerCanvas.width = equalizerCanvas.height = equalizerSize;
      document.getElementById(equalizerDiv.id).appendChild(equalizerCanvas);

      _gEqualizer.canvas = document.getElementById('eqCanvas');
      // Check the element is in the DOM and the browser supports canvas
      if(_gEqualizer.canvas.getContext) {
        // Initaliase a 2-dimensional drawing context
        _gEqualizer.ctx = _gEqualizer.canvas.getContext('2d');
        //_gEqualizer.ctx.shadowBlur = 4; _gEqualizer.ctx.shadowColor = "white";  // glow attempt, renders awfully slow
      }

      for (var i = 0, len = 256; i < len; i++) {
        _gEqualizer.old.push(0);
      }
    //}

  },
  update: function(data){

        data.onUpdate = function() { _gEqualizer.draw(_gEqualizer.old); };
        TweenLite.to(_gEqualizer.old, 0.14, data); // smooth out tweening between data arrays

  },
  peak: function() {  // finds out the current position and relative peak level of the soundcloud waveform
      var pos = Math.floor(_gEqualizer.wave.length*(_gPlayer.position/_gPlayer.duration) ),
          e = Math.sin(2*Math.PI*_gEqualizer.wave[pos]*_gPlayer.volume*0.01 ),
          number = _gEqualizer.wave[pos]*(_gPlayer.volume*0.01),
          level = parseFloat( Math.abs(e) ).toPrecision(12);

      return level;
  },
  waveform: function() {
    var data = [],
        n = 256;

        _gConsole.current<n ? _gConsole.current++ : _gConsole.current = 0;
     
    var pos = Math.floor(_gEqualizer.wave.length*(_gPlayer.position/_gPlayer.duration) );

    for (var i = 0, len = n; i < len; i++) {

        /*A * sin(B * x + C) + D

        A is amplitude
        B is period
        C moves the wave along the x-axis
        D moves the wave along the y-axis*/

        var amplitude = _gEqualizer.peak(),
            period    = pos,
            move      = _gEqualizer.wave[pos+i],
            random    = _gEqualizer.wave[pos],
            sine      = amplitude * Math.sin(period*move);

        var e = Math.sin(2*Math.PI*_gEqualizer.peak() )*Math.random()*(_gEqualizer.wave[pos]);
        

        data.push(sine);
        
      }

    return data;
    console.log(data);
  },
  loading: function() {

        var data = [],
            current = 0,
            n = 256;

        updateData();

        function updateData() {

          data.length = 0;

          var amplitude = 0.6;
          var freq = 0.05;
          var phase = 24; 

          current<n ? current++ : current = 0;

          for (var i = 0, len = n; i < len; i++) {

            var sine = Math.sin(freq * (i - current + phase)) * amplitude;

            var s = Math.sin( sine*Math.PI-current )*0.2//Math.sin(Math.PI*i*ratio/n-current);
            
            data.push(s);
          }

          TweenLite.to(_gEqualizer.old, 0.2, data);

        }

        data.onUpdate = function() { _gEqualizer.draw(_gEqualizer.old); };
        data.onComplete = function() { if (_gEqualizer.ready) { TweenMax.killTweensOf(_gEqualizer.old); _gEqualizer.done(); } else { updateData(); } }


  },
  done: function() {  // resets the equalizer to zero, nice and sweet
    var data = [],
    n = 256;
    
    for (var i = 0, len = n; i < len; i++) {
      data.push(0);
    }

    //console.log(data);
    TweenLite.to(_gEqualizer.old, 0.2, data);

    data.onUpdate = function() {
          //console.log('draw eq: '+_gEqualizer.old[0]+'/'+data[0]);
          _gEqualizer.draw(_gEqualizer.old);
        };
  },
  draw: function(target) {
      _gEqualizer.ctx.clearRect(0, 0, _gEqualizer.canvas.width, _gEqualizer.canvas.height);
            for (var i = 0, len = _gEqualizer.n; i < len; i++) {

              var angle = (360/_gEqualizer.n)*i,
                  j = Math.floor((i*256)/_gEqualizer.n),
                  t = target[j]*_gEqualizer.w,
                  p = _gEqualizer.getPoints(angle, _gEqualizer.r, t);


              // arc method, which looks sharp and neat
              var eachAngle = (360/_gEqualizer.n)*_gEqualizer.ratio,
              startAngle = angle - (eachAngle*.5), 
              endAngle = angle + (eachAngle*.5);

              _gEqualizer.drawSolidArc(_gEqualizer.toRad(startAngle), _gEqualizer.toRad(endAngle), _gEqualizer.clr, _gEqualizer.r, target[j]*_gEqualizer.w, _gEqualizer.toRad(eachAngle), p);
      }
  },
  toRad: function(nDeg) {
    return (nDeg * Math.PI/180);
  },
  getPoints: function(angle, radius, level) {
    var radian = angle * (Math.PI/180), // convert degrees in radians
        cx = _gEqualizer.cx,
        cy = _gEqualizer.cy,
        sX = Math.ceil( Math.cos(radian) * radius + cx ),
        sY = Math.ceil( Math.sin(radian) * radius + cy ),
        eX = Math.ceil( Math.cos(radian) * (radius-level) + cx ),
        eY = Math.ceil( Math.sin(radian) * (radius-level) + cy );

    return {
        radian: radian,
        startX: sX,
        startY: sY,
        endX: eX,
        endY: eY
    }; 
  },
  drawSolidArc: function(startAngle, endAngle, color, radius, width, radians, p) {

    _gEqualizer.ctx.fillStyle = _gEqualizer.clr;

    var innerRadius = radius-width;
    _gEqualizer.ctx.beginPath();
    _gEqualizer.ctx.arc(_gEqualizer.cx, _gEqualizer.cy, radius, startAngle, endAngle, false);
    var endPoint = _gEqualizer.getArcEndpointCoords(innerRadius, endAngle);
    _gEqualizer.ctx.lineTo(endPoint.x,endPoint.y);
    _gEqualizer.ctx.arc(_gEqualizer.cx, _gEqualizer.cy, innerRadius, endAngle, startAngle, true);

    _gEqualizer.ctx.closePath();
    _gEqualizer.ctx.fill();

  },
  getArcEndpointCoords: function(radius, radians) {
    return  {
      x: radius * Math.cos(radians) + _gEqualizer.cx, 
      y: radius * Math.sin(radians) + _gEqualizer.cy
    };
  },
  clear: function() {
    _gEqualizer.ctx.clearRect(0, 0, _gEqualizer.canvas.width, _gEqualizer.canvas.height);
  },
  usePeak:false, useWave:false, data:[], wave:[], current:0, useSoundCloudWave:false, ready:false, e: null, n: 0, r: 0, w: 0, cx:0, cy:0, clr: "#FFF", ratio:1, svg: true, canvas: null, ctx : null, old:[], zero:[]
}


// gear component made with raphael.js

/* Custom Made Raphael Plugin for building the Gear, will be packed in the libs file once finished */
Raphael.fn.geargroup = function (holder, cx, cy, r, rin, gSet, $) {
    
    var paper = this,
        rad = Math.PI / 180,
        //_entries = gSet._entries,
        titles = [],
        labels = [],
        authors = [],
        sectors = [],
        idles = [],
        angles = [],
        overs = [],
        starts = [],
        group = this.set();
    function sector(cx, cy, r, startAngle, endAngle, params) {
        
        var x1 = cx + r * Math.cos(-startAngle * rad),
            x2 = cx + r * Math.cos(-endAngle * rad),
            y1 = cy + r * Math.sin(-startAngle * rad),
            y2 = cy + r * Math.sin(-endAngle * rad),
            xx1 = cx + rin * Math.cos(-startAngle * rad),
            xx2 = cx + rin * Math.cos(-endAngle * rad),
            yy1 = cy + rin * Math.sin(-startAngle * rad),
            yy2 = cy + rin * Math.sin(-endAngle * rad);
        
        return paper.path(["M", xx1, yy1,
                           "L", x1, y1, 
                           "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, 
                           "L", xx2, yy2, 
                           "A", rin, rin, 0, +(endAngle - startAngle > 180), 1, xx1, yy1, "z"]
                         ).attr(params);
        
    }

    // Draws an arc inside the gear
    function circularArc (centerX, centerY, radius, startAngle, endAngle, params) {

      var startX = centerX+radius*Math.cos(-startAngle*rad); 
      var startY = centerY+radius*Math.sin(-startAngle*rad);
      var endX = centerX+radius*Math.cos(-endAngle*rad); 
      var endY = centerY+radius*Math.sin(-endAngle*rad);
      return arc(startX, startY, endX-startX, endY-startY, radius, radius, 0).attr(params);

      function arc(startX, startY, endX, endY, radius1, radius2, angle) {
        var arcSVG = [radius1, radius2, angle, 0, 1, endX, endY].join(' ');
        return paper.path('M'+startX+' '+startY + " a " + arcSVG );
        };
    };

    // random colors
    function rainbow() {
      // 30 random hues with step of 12 degrees
      var hue = Math.floor(Math.random() * 30) * 12;

      return $.Color({
        hue: hue,
        saturation: 0.9,
        lightness: 0.6,
        alpha: 1
      }).toHexString();
    };


    var angle = 0,
        start = 0,
        timer,
        degrees = [],
        process = function (j) {
            var piece = paper.set(),
                label = paper.set(),
                angleplus = 360 * _entries.length / (_entries.length*_entries.length),
                popangle = angle + (angleplus / 2),
                color = _entries[j].color,
                tAlpha = gSet.textAlpha!=null?gSet.textAlpha:0.3,
                ms = 500,
                delta = gSet.outerPadding,
                bcolor = gSet.randomColors ? rainbow() : color,
                tcolor = gSet.textColor,
                padding = gSet.sectorPadding,
                s = sector(cx, cy, r-(gSet.innerPadding*.5), angle+(padding*.5), angle + angleplus-(padding*.5), {fill:"none", stroke: "none"}),
                o = sector(cx, cy, r+(delta*.5), angle+(padding*.5), angle + angleplus-(padding*.5), {fill:"none", stroke: "none"}),
                p = sector(cx, cy, r, angle+(padding*.5), angle + angleplus-(padding*.5), {fill:bcolor, stroke: "none", "stroke-width": 6, /*"stroke-opacity": 0,*/ 'opacity':1});
                //a = circularArc(cx, cy, r, angle+angleplus, angle, {fill: "none", stroke: "#FFFFFF", "stroke-width":30, 'opacity':0.2});
                
                var _idleAlpha = tAlpha;

                var idle = p.attr('path');   // copy the idle piece path into memory
                var strt = s.attr('path');

                // target points
                var tx = Math.floor(+cx + (+r + delta) * Math.cos(-popangle * rad));
                var ty = Math.floor(+cy + (+r + delta) * Math.sin(-popangle * rad));

                // Visual Guides

                // paper.circle(tx, ty, 5)/*.attr({"fill":"#fff", "stroke":"none"});*/        // guide points
                // paper.circle(cx, cy, 1).attr({"fill":"#fff", "stroke":"none"});        // center circle
                // paper.text(cx, cy, cx+', '+cy);  // center coordinates
                



              

                //if ($(window).width() < 767) { author.attr({'opacity':0}) };


                if (Gear.specialChars) {
                  // Text Method  (works only with Google Font or CSS Fonts)
                  var direction = Gear.directionRTL ? 'end':'start';

                  var title = paper.text(tx, ty, _entries[j].title.toUpperCase()).attr({fill: tcolor, stroke: "none", opacity: 1, "font-size": gSet.titleSize, "font-family": "'Helvetica', Arial, sans-serif"});
                  title.attr({transform: "r" +(-popangle)+"t0,-"+gSet.titleSize*.5, 'text-anchor': direction});

                  var author = paper.text(tx, ty, _entries[j].author.toUpperCase()).attr({fill: tcolor, stroke: "none", opacity: 1, "font-size": gSet.authorSize, "font-family": "'Helvetica', Arial, sans-serif"});
                  author.attr({transform:"r" +(-popangle)+"t0,"+gSet.titleSize*.5, opacity: _idleAlpha*.5, 'text-anchor': direction});
                } else {
                  // Print Method  (works only with Cufon Fonts, but renders better)ù
                
                  var title = paper.print(tx, ty, _entries[j].title.toUpperCase().replace(/^(.{25}[^\s]*).*/, "$1"), paper.getFont("Maven Pro"), gSet.titleSize).attr({fill: tcolor, opacity: _idleAlpha});
                  title.transform("t0,-"+gSet.titleSize*.5);
                  TweenMax.set(title, {raphael:{rotation:-popangle, globalPivot:{x:tx, y:ty}}}); // fixes the damn pivot, works!

                  var author = paper.print(tx, ty, _entries[j].author.toUpperCase(), paper.getFont("Maven Pro"), gSet.authorSize).attr({fill: tcolor, opacity: _idleAlpha*.5});
                  author.transform("t0,"+gSet.authorSize*.5);
                  TweenMax.set(author, {raphael:{rotation:-popangle, globalPivot:{x:tx, y:ty}}}); // fixes the damn pivot, works!
                }

                


                



	             var aW = (gSet.width-gSet.outerRay)*.5;
	             var aH = (2 * Math.PI * gSet.outerRay)/_entries.length;
	             //console.log('ah: '+aH)
	             var area=paper.rect(tx,ty,aW,aH/*gSet.titleSize+gSet.authorSize*/).attr({fill:"red", opacity:0});
	             area.transform("t-"+gSet.outerPadding+",-"+aH*.5);
	             TweenMax.set(area, {raphael:{rotation:-popangle, globalPivot:{x:tx, y:ty}}});


                //TweenMax.set(pic, {raphael:{rotation:-popangle, globalPivot:{x:tx, y:ty}}});*/
                  
                // close everything
                degrees.push(angle);
                angle += angleplus;
                
                

                label.push(title);
                label.push(author);

                piece.push(label);
                piece.push(area);
                piece.push(p);

                group.push(piece);

                /* served outside for iterations */
                titles.push(title);
                authors.push(author);
                labels.push(label);
                sectors.push(p);

                idles.push(idle);   // fixes idle animation
                starts.push(strt);
                overs.push(o);
                
                angles.push(popangle);


                p.attr({path:starts[j]}); // apply a hidden path to the piece
                var pieceAnimation = Raphael.animation({path:idles[j]}, ms*2, "elastic"); // declase an animation to it
                p.animate(pieceAnimation.delay(100*j) );  // and finally animate the piece in the circle

                TweenMax.from(title, 0.5, {raphael:{opacity:0}, delay:0.1*j});
                TweenMax.from(author, 0.5, {raphael:{opacity:0}, delay:0.1*j});
                //title.animate({alpha:1}, ms);


                var localTarget = 0;

                /* This nifty trick enables me to call it from outside its scope! Very neat. */
                Raphael.fn.geargroup.callSector = function(n) { doSector(n); }

                // Generic function that highlights the active sector, automatically or by interaction
                function doSector(n) {

                    if (debug)( console.log('doing sector n: '+n) );

                    var t = _gConsole.select(n);  // target selection, ordered or shuffled
                    if (debug)( console.log('velocity is:' +tracker.getVelocity("rotation") ) );

                    if (tracker.getVelocity("rotation")==0 || !tracker.getVelocity("rotation")) {   // additional check to avoid rotation and click at once!
                      if (debug)( console.log('tracker is ready') );
                        _gPlayer.playSound(gSet, n);
                        TweenMax.to($('#'+holder), 1, {rotation:angles[t]+"_short", ease:Cubic.easeOut, 
                          onStart: function(){
                            _gConsole.rotating = true;
                            if (debug)( console.log('start rotation') );                         
                          }, 
                          onComplete: function(){
                            _gConsole.rotating = false;
                            if (debug)( console.log('end rotation') );
                            highlightArc(t);
                            selectLabel(t);
                          }});
                    }

                    _gConsole.showConsole(); 
                }

                Raphael.fn.geargroup.fixArc = function(n) { highlightArc(n); };

                function highlightArc(t) {
                        if (debug)( console.log('rearranging arcs...') );
                            for (var i = 0, len = _entries.length; i < len; i++) {

                                var obj = sectors[i];

                                if (i!=t) {
                                    obj.stop().animate({path:idles[i]}, ms, ">", function(){ /*obj.attr({path:idles[i]})*/ });
                                } else { 
                                   if (!_gConsole.peakEnabled || !flash || mobile) { obj.stop().animate({path:overs[i].attr('path')}, ms) };
                                }
                            }
                }
                
                // Click and touch effect
               /*Modernizr.touch*/ /*mobile? handleTouchEvents() : piece.click(function(e) { 

                  console.log('clicked on: '+j);
                  _gConsole.clicked = true;
                  doSector(j);
                });*/

               function handleClickEvent() {

                piece.click(function(e) { 

                  if (debug)( console.log('clicked on: '+j +'/ already clicked?'+_gConsole.clicked) );

                  _gConsole.clicked = true;
                  doSector(j);
                });
               }


                function handleTouchEvents() {
                    if (debug)( console.log('handling touch...') );

                    piece.touchstart(function(e) { 
                        e.preventDefault(); 
                        });

                    piece.touchend(function(e) { 
                        e.preventDefault(); 

                        //document.getElementById('debug').innerHTML = "tracker: "+ tracker.getVelocity("rotation");
                        
                        //if (tracker.getVelocity("rotation")==0) {   // this happens when no rotation is triggered and finds the tap event, clever uh? :)
                            _gConsole.clicked = true;
                            doSector(j);
                        //}
                    });
                }

               handleTouchEvents();
               handleClickEvent();



               if (/*!Modernizr.touch*/ !mobile) {

                piece.mouseover(function () {
                    //clearTimeout(timer);

                    title.stop().animate({opacity:1},ms);
                    author.stop().animate({opacity:0.5},ms);

                    
                    for (var i = 0, len = labels.length; i < len; i++) {
                        var t = titles[i];
                        var a = authors[i];

                        if (i!=j) {
                            //t.stop().animate({opacity:0.2},ms);
                            //a.stop().animate({opacity:0.1},ms);
                        } else {
                            //t.stop().animate({opacity:1},ms);
                            //a.stop().animate({opacity:0.5},ms);
                        }
                    }

                    piece.attr({'cursor':'pointer'});   // show the right hand cursor

                }).mouseout(function () {
                    
                    var c = Math.floor(j);
                    var d = Math.floor(localTarget);
                    
                    if (!title.data('flag')) {
                      title.stop().animate({opacity:_idleAlpha},ms);
                      author.stop().animate({opacity:_idleAlpha*.5},ms);
                    }

                    function out() {
                        for (var i = 0, len = labels.length; i < len; i++) {
                            var t = titles[i];
                            var a = authors[i];

                            if (/*i!=j*/ i==localTarget) {
                            /*t.stop().animate({opacity:1},ms);
                            a.stop().animate({opacity:0.5},ms);*/
                            } else {
                              t.stop().animate({opacity:_idleAlpha},ms);
                              a.stop().animate({opacity:_idleAlpha*.5},ms);
                            }
                        }
                    }
                    piece.attr({'cursor':'default'});   // restore the arrow cursor
                });

                }


                Raphael.fn.geargroup.selectLabel = function(n) { selectLabel(n); }

                function selectLabel(n) {
                  if (debug)( console.log('selecting label') );
                  for (var i = 0, len = labels.length; i < len; i++) {
                      var t = titles[i];
                      var a = authors[i];

                      if (i==n) {

                        TweenMax.to(t, 0.5, {raphael:{opacity:1}});
                        TweenMax.to(a, 0.5, {raphael:{opacity:0.5}});

                        t.data('flag', true);

                      } else {

                        t.data('flag', false);

                        TweenMax.to(t, 0.5, {raphael:{opacity:_idleAlpha}});
                        TweenMax.to(a, 0.5, {raphael:{opacity:_idleAlpha*.5}});

                      }
                    }
                }


                function doLabels(visible, d) {

                    for (var i = 0, len = labels.length; i < len; i++) {
                        var t = titles[i];
                        var a = authors[i];

                            if (visible) {
                                t.stop().animate({opacity:/*1*/_idleAlpha},d);
                                a.stop().animate({opacity:/*0.5*/_idleAlpha*.5},d);
                            } else {
                              t.stop().animate({opacity:0},d);
                                a.stop().animate({opacity:0},d);  
                            }
                    }
                }


                // this nifty function updates the active sector with the provided audio peak!
                Raphael.fn.geargroup.updatePeak = function(n, level) {

                  if (level && level >= 0 ) {
                    //console.log('updating peak for: '+n);
                    var a = degrees[n];
                    var p = sector(cx, cy, r+((delta*.5))*level, a+(padding*.5), a + angleplus-(padding*.5), {fill:"none", stroke: "none"})
                    var o = sectors[n];

                    o.animate({path:p.attr('path')}, 70, ">"); // previous value was 200, this one is more reactive!
                  }
                  

                }
                

                start += .1;

                Raphael.fn.geargroup.clear = function() {

                  paper.clear();
                  titles = [];
                  labels = [];
                  authors = [];
                  sectors = [];
                  idles = [];
                  angles = [];
                  overs = [];
                  starts = [];
                  degrees = [];
                  angle = 0;
                  start = 0;
                  
                  titles.length = labels.length = authors.length = sectors.length = idles.length = angles.length = overs.length = starts.length = degrees.length = 0;

                  _entries.length = 0;
                  _entries = [];

                  _gConsole.ordered.length = 0;
                  _gConsole.ordered = [];

                  _gConsole.shuffled.length = 0;
                  _gConsole.shuffled = [];

                  //n = 0;	not needed, duh?
                }

                Raphael.fn.geargroup.build = function(e, autoPlay) {
                  iterate();

                  if (Modernizr.touch && mobile) {
                    if (autoPlay && _gPlayer.touched) { doSector(_gConsole.select(0)); }
                  } else {
                    if (autoPlay) { doSector(_gConsole.select(0)); }
                  }
                }
        };
    
    // This is the fastest loop achievable, take note.
    
    function iterate() {
      if (debug)( console.log('iterating') );
      for (var i = 0, len = _entries.length; i < len; i++) {
         process(i);
      }
    }

    iterate();
    

    document.getElementById(gSet.id).style.marginTop = '-'+gSet.height*.5+'px';
    document.getElementById(gSet.id).style.marginLeft = '-'+gSet.width*.5+'px';

    // Add interaction to the gear
    Draggable.create("#"+holder, {type: "rotation", throwProps: true});

    var tracker = ThrowPropsPlugin.track(document.getElementById(holder), "rotation");


    $('#'+holder).bind('mousewheel', function(event, delta) {
            event.preventDefault();
            
            delta > 0 ? prev() : next();

            function next() { TweenMax.to($('#'+holder), 0.5, {rotation:/*(180 / Math.PI)**/document.getElementById(holder)._gsTransform.rotation+(360/_entries.length)+'_short', ease:Cubic.easeOut}); }
            function prev() { TweenMax.to($('#'+holder), 0.5, {rotation:/*(180 / Math.PI)**/document.getElementById(holder)._gsTransform.rotation-(360/_entries.length)+'_short', ease:Cubic.easeOut}); }

        });


     $('#_gConsole').bind('mousewheel', function(event, delta) {
            event.preventDefault();
            delta > 0 ? _gPlayer.volumeUp() : _gPlayer.volumeDown();
      });

    return group;
};

$.noConflict();

}(jQuery, this, this.document));



// utils
if ( typeof Object.create !== 'function' ) {
	Object.create = function( obj ) {
		function F() {};
		F.prototype = obj;
		return new F();
	};
}

Object.size = function(obj) {
var size = 0, key;
for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
}
return size;
};