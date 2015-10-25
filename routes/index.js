
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.html', { title: 'Watson\'s Book Shop' });
};
exports.client = function(req, res){
  res.render('client.html', { title: 'Watson\'s Book Shop' });
};
exports.create = function(req, res){
  res.render('create.html', { title: 'Watson\'s Book Shop' });
};

exports.market = function(req, res){
  res.render('market.html', { title: 'Watson\'s Book Shop' });
};

