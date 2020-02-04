<!doctype html>
<html class="no-js" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>My HTML5 Player</title>
  <link rel="icon" type="image/png" href="favicon.png?v=0.1" />
  
  <link rel="stylesheet" href="css/foundation.min.css" />

  <link rel="stylesheet" href="css/gear.css?v=0.1">
  <link rel="stylesheet" href="css/styles.css?v=0.1">

  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
</head>
<body>
    <!-- Stage Start -->
      <div class="stage">
     <!-- Desktop Navigation Start -->
 <nav class="top-bar row">
           <div class="logo" style="text-align:center"><span    class="hide-for-small">  My  HTML5 Music  Player </span> <span class="show-for-small">Music Player</span> </div>
     <hr>
  </nav>
<!-- Desktop Navigation End -->


          <!-- Content Start -->
          <div class="content">
                
                <div class="wrapper">
                
                <section class="row intro" id="intro">
                  <div class="large-12 columns">
                   
                  </div>
                  <a href="#intro"><img src="img/head.jpg"></a>
                  
                </section>  

                <footer>
                    <div class="row">

                      <div class="large-12 medium-12 small-12 columns">
                        <p>© 2020 All Rights Reserved. <br class="show-for-small"><a href="https://ankitray1.github.io"> Made with <i class="fi-heart"></i> in India.</a></p>
                      </div>

                    </div>
                    
                  </footer>

                </div>
              </div>
          </div>
          <!-- Content End -->

          <div class="overlay"><span></span></div>

      </div>
      <!-- Stage Wrapper End -->


  <!--  Player Start -->
   <div class="gearWrap"> <div id="gearContainer" class="gear" data-gear="json/setup.json"></div> </div>
  <!--  Player End -->


  <script src="js/jquery.min.js"></script>
  <script src="js/foundation.min.js"></script>
  
  <script src="http://connect.soundcloud.com/sdk.js"></script>

  <script src="js/jquery.gearplayer.libs.min.js"></script>
  <script src="js/jquery.gearplayer.min.js"></script>
  
  <script src="js/app.js"></script>

</body>
</html>
