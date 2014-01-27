function buildWith(builderName) {
  return require("./builders/" + builderName);
}

module.exports = {
  buildWith: buildWith
};
