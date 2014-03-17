import {
  test,
  moduleForComponent
} from '<%= modulePrefix %>/tests/helpers/module_for';

moduleForComponent('template-less');

test("template", function(){
  var component = this.subject();
  ok(this.$());
});
