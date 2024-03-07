function admin(req, res, next) {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    });
    if(req.url!='/'){
      req.session.redirect=req.url
    }
    else{
      req.session.redirect=`${req.url}`

    }
    next();
  }
  function user(req, res, next) {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    });
    if(req.url!='/sign-in'){
      req.session.redirect='/'
    }
    next();
  }
  
module.exports={
  admin,user
}