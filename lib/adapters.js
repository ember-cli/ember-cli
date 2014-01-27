function loadAdapter(name) {
  return require("./adapters/" + name);
}

module.exports = {
  to: loadAdapter
};
