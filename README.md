### “Html5 Magic Audio player” Documentation by Ankit 

* * * * *

“ HTML5 Audio Player” {.center}
=========================



* * * * *

Table of Contents {#toc .alt}
-----------------

1.  [Introduction](#introduction)
2.  [DOM Structure](#domStructure)
3.  [CSS Files](#cssFiles)
4.  [JavaScripts](#javascript)
5.  [Initializing](#init)
6.  [JSON Options](#json)
7.  [Supported Methods](#methods)
8.  [SoundCloud API](#soundcloud) *(How to get the Client ID)*
9.  [Special Characters](#special)
10. [Sources and Credits](#credits)
11. [History](#history)

* * * * *

### **A) Introduction** - [top](#toc) {#introduction}

Before doing anything you need to work on a webserver. Go to
[apachefriends.org](http://www.apachefriends.org) and install XAMMP
which will enable you a local development environment. Of course you can
use any kind of Apache server. Once you've done copy the root inside the
htdocs folder and access it from your browser to see it running. If you
try accessing it locally it simply won't work.

#### Provided folders & files

-   app
    -   css *All used stylesheets generated from the LESS files. The
        main file is gear.css and should be included with the foundation
        icons folder.*
    -   js *All neede javascripts. You'll need at least jquery,
        jquery.gearplayer and jquery.gearplayer.libs to get it working.*
    -   img *Just the image folder. You can get rid of it or use it to
        store your own images.*
    -   json *Those small files are used to load the Gear Player setup
        and the playlist albums. Keep the structure as-is!*
    -   less *Do you want to edit the provided stylesheets? Use those
        LESS files and compile them from there.*
    -   mp3 *Just the music folder, you can rename it or use your own
        folder. Just keep sure the paths are correct in the JSON files.*
    -   svg *A few icons used in the demo. You can get rid of them.*
    -   swf *This folder is used by SoundManager2 and summons the Flash
        Player APIs needed for the Equalizer to work. Whenever Flash
        fails HTML5 will be used. Keep it.*
    -   utils *Contains a php script which translates the Soundcloud
        songs to a real url so the player can animate properly the sound
        wave and resume it without issues.*
    -   .htaccess *This is reccomended to be used as it enables you to
        gzip your scripts and allows you to have shorturls. You can just
        skip it. It's not needed.*
    -   humans.txt *Just a standard file for humans.*
    -   robots.txt *And a standard file for crawlers.*
    -   index.php *The main demo page. Run this on a webserver to see it
        working!*
-   docs *This userguide!*

If you want to kickstart your work, just copy the css, js, swf, and
utils folder and you're ready to go. Arrange the DOM and initialize the
script to see it in your page. 

### **B) DOM Structure** - [top](#toc) {#domStructure}

Audio Player needs just a little bit of code in your DOM Structure. Take
your time and organize your project by following this userguide. It will
be easy once you understand how it works.

#### Stage

First thing you need to do is wrapping your existing body content inside
a div and apply to it the stage class, like this:

    <div class="stage">
        <!-- your content here -->
    </div>

This is needed for the player for performance reasons. When Audio Player
is visible it hides the stage div from the DOM, getting this way more
rendering memory and a better experience overall. Of course you can also
omit this, but I strongly suggest you to organize your page this way to
avoid glitches and unwanted issues.

#### Audio Player

Then, append the Audio Wrapper right below the stage. Copy and paste the
following code:

    <div class="gearWrap"> <div id="gearContainer" class="gear" data-gear="json/setup.json"></div> </div>

Keep it like this since there are references in the provided
stylesheets. You can alter the data-gear value if you wish so. Just keep
sure the JSON path is correct.

#### Albums

You can summon new albums inside your existing website to any DOM
Object. The only thing you'll need to do is using the data-gearPlaylist
attribute. Here's an example:

    <div data-gearPath="json/album.json">

Whenever the user clicks the player will clear the existing album and
load the new one. It can be applied to any DOM Object. Once clicked the
Player will add to the container a "playing" class which comes handy if
you need to style your status in the page.

The DOM is ready, you just need to include the stylesheet and javascript
files.

* * * * *

### **C) CSS Files** - [top](#toc) {#cssFiles}

Copy the whole css folder inside your root. You can safely remove or
overwrite both "foundation.min.css" and "styles.css" - all the other
files should be kept. The only one you'll need to embed in your page is
called "gear.css" and you should include it in your head tag like this:

    <link link rel="stylesheet" href="css/gear.css">

I bet you're wondering why you should keep the other stylesheets? Well
it's easy to explain. The foundation-icons folder contains icons used
inside the player and are needed, while flashblock.css is used by
SoundManager2 whenever Flash is blocked by some extension.

Of course you're free to use the same icons for your project or load new
ones as you like.

The stylesheet was built with [LESS](http://lesscss.org/), a dynamic
Stylesheet Language. You'll find compressed css files in the css folder,
those are just for deploying. The ones used for production are located
inside the less folder.

I suggest you to build a new custom stylesheet and overwrite the rules
using a browser inspector like Firebug which will kickstart your work.
Though if you really need to edit those files you can do it with LESS. I
recommend using [WinLess](http://winless.org/) for Windows or
[LESS.app](http://incident57.com/less/) for Mac. These compilers will
generate for you a compressed styles.css file which is stored inside the
css folder.

* * * * *

### **D) JavaScripts** - [top](#toc) {#javascript}

Once your DOM is ready and you have successfully included the gear
stylesheet in your head you have to include the following javascript
files before the end of the body:

    <script src="js/jquery.min.js"></script>
      
    <script src="http://connect.soundcloud.com/sdk.js"></script>

    <script src="js/jquery.gearplayer.libs.min.js"></script>
    <script src="js/jquery.gearplayer.min.js"></script>

You should at first include jQuery if you don't have already. The
included version includes Sizzle as CSS selector engine and is provided
with Foundation, though you can use any flavour of jQuery as you like as
long you include it **before** the Audio Player scripts.

The SoundCloud javascript is needed only if you're planning to use
SoundCloud for your music. You can remove it safely if you don't need
this feature. We'll see later how to benefit from their APIs.

The last two files are mandatory: the first one is a collection of the
following libraries: Modernizr, PreloadJS, Greensock, Raphael.js, jQuery
Color, jQuery Mousewheel, SoundManager2. The second one is audio Player,
the main script that calls the mentioned libraries.

Despite the minified versions of the scripts, you can still optimize the
files further by gzipping them. You'll find an htaccess file in the root
which is already compiled to enable your server to do so.

* * * * *

### **E) Initializing** - [top](#toc) {#init}

So, you arranged the DOM and included all needed files. Though the
player sits there without doing anything, isn't it? Of course you need
to initialize it! It's meant that way, to keep give you more control
over the script. You can wake it up with the following javascript:

    $(document).ready(function(){ 
        $('.gearWrap').gearPlayer();
    });

You can also call it inside your own app script as long it's called when
the DOM is ready. Though even a dirty inline script tag will do the job
if you want to.

There is a neat app.js included that shows you how to organize your
stuff in the correct way. It's not needed to get it working though. Just
use the script above and it will initialize. It's up to you.

* * * * *

### **F) JSON Options** - [top](#toc) {#json}

You'll find a few files inside the json folder. These are loaded at
runtime from the player. The one loaded with the gear wrapper contains
several setup options which will be used to control most of the
functions of the player.

#### Setup

Some of these options can be overwritten when a new album is loaded.
I'll briefly explain each one here so you can play safely.

-   **id** *It should be the same as the one in the DOM. Leave this
    as-is.*
-   **albumCover** *It's the path the artwork displayed on the top left,
    keep sure it's correct.*
-   **albumTitle** *The title of the album which will shown near the
    artwork.*
-   **albumAuthor** *Displays the author name right below the title.*
-   **soundCloudEnabled** *This flag enabled the SoundCloud routine. If
    you're planning to use this service, set it to "true". If not set it
    to "false".*

-   **autoPlay** *When set to "true" will launch the first song without
    user input, but only on desktop. It won't fire on mobile due native
    restrictions, though the miniplayer will pop out for interaction. If
    "false" is set nothing happens, the player will just wait for the
    first album to be called.*
-   **shuffle** *Can be set to "true" or "false". It will mess the order
    when enabled. What would you expect from a shuffle function.*
-   **volume** *This is the level of the volume. It ranges from 0 to
    100.*
-   **peak** *Can be set to "true" or "false". When enabled and Flash is
    avalaible you'll see the sector bumping with the song peaks.*
-   **equalizer** *Can be set to "true" or "false". Summons a neat
    equalizer in the middle of the player and draws waves in realtime.*
-   **equalizerSVG** *Can be set to "true" or "false". This is an
    experimental option. I tried to render this part with SVG but runs
    very slow and can't tell if we'll ever get enough horsepower for
    this. Just leave it alone to "false" for now.*
-   **equalizerSize** *This value defines the width and height of the
    equalizer. Be careful. The bigger the slower it will run.*
-   **equalizerPadding** *How much space to leave around the equalizer.*
-   **equalizerColor** *The HEX color of the animated equalizer bars.*
-   **equalizerRatio** *This value sets the spacing between the bars.*
-   **width** *How much width to use for rendering the player.*
-   **height** *Ideally the same value as above.*
-   **outerRay** *The bigger ray that defines the outside.*
-   **innerRay** *The smaller ray that defines the inside.*
-   **outerPadding** *Space to be left on the outside.*
-   **innerPadding** *Space to be left on the inside.*
-   **sectorPadding** *Spacing between sectors along the Audio.*
-   **trackColor** *The color of the main circular track.*
-   **loadedColor** *The buffering circle color.*
-   **progressColor** *The progress circle color.*
-   **loadedThickness** *How "thick" the loaded circle is.*
-   **progressThickness** *How "thick" the progress circle is.*
-   **timeColor** *This colors the time in the middle of the player.*
-   **timeSize** *The size of the time text.*
-   **randomColors** *Can be set to "true" or "false". When enabled it
    randomizes the colours of each sector and overwrites any present
    color in the entries.*
-   **textColor** *The color of each text around the sectors.*
-   **textAlpha** *The amount of transparency to apply when idle.*
-   **titleSize** *The title text size of each song around the sectors.*
-   **authorSize** *The author text size displayed below each title.*
-   **dockToRight** *Can be set to "true" or "false". If enabled it will
    dock the miniplayer to the right.*

#### Entries

This part creates the playlist of each album. It's pretty simple to set
up.

-   **title** *The song title.*
-   **author** *The song author.*
-   **media** *The url to the media.*
-   **link** *This is optional, it's a link used as metadata*
-   **color** *The sector color to apply for this song.*

### **G) Supported Methods** - [top](#toc) {#methods}

Audio Player comes with a few extra methods for your special needs which
might come handy when your project is built with ajax and needs a little
more control. The following methods are supported.

    var g = $('.gearWrap').gearPlayer();
    g.ready(); // triggered when the player is ready
    g.show();  // shows the player interface
    g.refresh();  // scans for new albums in the DOM
    g.destroy(); // gets rid of the player

    g.volume(100); // sets the volume of the player, n can be from 0 to 100
    g.change(); // triggered whenever a change happens, it shows the event as argument in the callback
    g.play(0); // plays the track when paused or initializes a new one when a number is set as argument
    g.pause(); // toggles pause once

    g.album('json/new.json'); // launches a new album with the provided json url
    g.deeplink('json/new.json'); // overwrites the setup json and is meant for deeplinks

    g.get('volume'); // returns the current level of the volume
    g.get('paused'); // returns the pause status
    g.get('title'); // returns the album title being played
    g.get('author'); // returns the author of current album
    g.get('deeplink'); // returns deeplink string
    g.get('total'); // returns total number of album tracks
    g.get('current'); // returns the current song number
    g.get('open'); // returns the open status of the gui
    g.get('entries'); // returns the playlist array

#### Examples

Let's say you want to show the player by clicking on something on your
page. Here's how you can do it.

    var g = $('.gearWrap').gearPlayer();

    g.ready(function(){ 

        // player is ready and we can apply our events

        $('.button').click(function(e){
            e.preventDefault(); 
            g.show(); // this shows the player interface
        });

    });

Are you building an AJAX Project? No problem. Here's how you can handle
it.

    $.ajax({ url: "page.php", context: document.body }).done(function() {
      g.refresh(); // this scans the whole document again for new albums and adds them to its routine
    });

* * * * *



### **I) Special Characters** - [top](#toc) {#special}

The default rendering mode of the Audio Player use a vector method
offered by Raphael.js that allows a smooth and crisp text to be
displayed on the sectors in any angle. There is only one downside: it
does support only the characters included in the embedded font. So, if
you need to use special characters you need to enable a flag that will
generate for you simple text fields instead of the vector objects.

You'll need to add the specialChars flag to change how the fields around
the sectors are rendered. It is set to false by default.

    var g = $('.gearWrap').gearPlayer();
    g.specialChars(true);

You can style them as you wish through a custom stylesheet and the
content can be manipulated too directly in the DOM.

* * * * *

### **J) Sources and Credits** - [top](#toc) {#credits}

The following libraries were used:

-   SoundManager2 by Schillmania
    [schillmania.com/projects/soundmanager2](http://schillmania.com/projects/soundmanager2/)
-   Greensock by Jack Doyle
    [www.greensock.com](http://www.greensock.com)
-   Raphael.js by Dmitry Baranovskiy
    [raphaeljs.com](http://raphaeljs.com)
-   Preload.js by Grant Skinner [createjs.com](http://createjs.com/)
-   jQuery Mousewheel by Brandon Aaron
    [github.com/brandonaaron/jquery-mousewheel](https://github.com/brandonaaron/jquery-mousewheel)
-   jQuery Color Animations
    [github.com/jquery/jquery-color](https://github.com/jquery/jquery-color)

The following icons were used:

-   Foundation Icon Fonts 3 by ZURB
    [zurb.com/playground/foundation-icon-fonts-3](http://zurb.com/playground/foundation-icon-fonts-3)

Included photos courtesy of Envato Asset Library.

* * * * *


Once again, thank you so much for downloading this app code. As I said at the
beginning, I'd be glad to help you if you have any questions relating to
this app. No guarantees, but I'll do my best to assist. If you have a
more general question relating to my code on github, you can raise issue.
**Sincerely, Ankit (Full stack Web Developer)**

* * * * *  * 
