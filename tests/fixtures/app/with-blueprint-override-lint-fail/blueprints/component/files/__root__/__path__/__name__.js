const foo = 'bar';
// https://eslint.org/docs/latest/rules/no-extra-boolean-cast:
if (!!foo) {
  console.log(foo);
}
