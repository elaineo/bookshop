
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.html', { title: 'Watson\'s Book Shop' });
};
exports.client = function(req, res){
  res.render('client.html', { title: 'Watson\'s Book Shop' });
};