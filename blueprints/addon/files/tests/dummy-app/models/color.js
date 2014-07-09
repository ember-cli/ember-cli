import DS from 'ember-data';

var Color = DS.Model.extend({
  color: DS.attr('string')
});

Color.FIXTURES = [
  {id: 1, color: 'red'},
  {id: 2, color: 'yellow'},
  {id: 3, color: 'green'}
];

export default Color;
