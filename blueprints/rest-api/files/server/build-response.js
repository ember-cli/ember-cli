module.exports = function buildResponse (name, data) {
  var response = {};

  response[name] = data;
  return response;
};
