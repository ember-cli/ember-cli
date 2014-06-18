import DS from 'vendor/ember-data/ember-data';

export default DS.Transform.extend({
  deserialize: function(serialized) {
    return serialized;
  },

  serialize: function(deserialized) {
    return deserialized;
  }
});
