^grey^You may generate models with as many attrs as you would like to pass. The following attribute types are supported:^grey^
  <attr-name>
  <attr-name>:array
  <attr-name>:boolean
  <attr-name>:date
  <attr-name>:object
  <attr-name>:number
  <attr-name>:string
  <attr-name>:belongs-to:<model-name>
  <attr-name>:has-many:<model-name>

For instance: ^green^\`ember generate model taco filling:belongs-to:protein toppings:has-many:toppings name:string price:number misc\`^green^
would result in the following model:

```js
import DS from 'ember-data';
export default DS.Model.extend({
  filling: DS.belongsTo('protein'),
  toppings: DS.hasMany('topping'),
  name: DS.attr('string'),
  price: DS.attr('number'),
  misc: DS.attr()
});
```
