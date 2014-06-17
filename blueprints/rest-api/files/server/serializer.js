/**
  Serializer to normalize/serialize between the formats expected
  by NeDB and Ember Data DS.RESTSerializer

  NeDB expects the primaryKey to be a property with the name '_id'.
  DS.RESTSerializer expects the property to be called 'id'.
*/

var primaryKey = '_id'; // primaryKey for NeDB

module.exports = {
  /**
    Serialize records from NeDB to DS.RESTSerializer format

    @method serialize
    @param {Object|Array} records
    @return {Object|Array} serialized records
  */
  serialize: function(records) {
    return (Array.isArray(records)) ? serializeCollection(records) : serializeSingle(records);
  },

  /**
    Normalize records from DS.RESTSerializer to NeDB format.

    @method normalize
    @param {Object|Array} records
    @return {Object|Array} normalized records
  */
  normalize: function (records) {
    return (Array.isArray(records)) ? normalizeCollection(records) : normalizeSingle(records);
  }
};


// PRIVATE SERIALIZE HELPER FUNCTIONS
var serializeId = function(hash) {
  hash.id = hash[primaryKey];
  delete hash[primaryKey];

  return hash;
};

var serializeSingle = function(record) {
  return serializeId(record);
};

var serializeCollection = function(records) {
  var result = records.map(function(record) {
      return serializeSingle(record);
  });

  return result;
};


// PRIVATE NORMALIZE HELPER FUNCTIONS
var normalizeId = function(hash) {
  hash[primaryKey] = hash.id;
  delete hash.id;

  return hash;
};

var normalizeSingle = function (record) {
  return normalizeId(record);
};

var normalizeCollection = function(records) {
  var result = records.map(function(record) {
      return normalizeSingle(record);
  });

  return result;
};