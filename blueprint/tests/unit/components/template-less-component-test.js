import {
  test,
  moduleForComponent
} from 'ember-qunit';

moduleForComponent('template-less');

test("template", function(){
  var component = this.subject();
  ok(this.$());
});
