module.exports = function(app) {
  app.get('<%= path %>', function(req, res) {
    res.send('hello');
  });
};
