import { test , moduleForComponent } from 'appkit/tests/helpers/module_for';

moduleForComponent('template-less');

test("template", function(){
  var component = this.subject();
  ok(this.$());
});
