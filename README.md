## ember-cli website

getting started

```sh
bundle install
ruby run.rb
```

you can now view the result at http://localhost:4000/

## Windows Users, read on

On windows, yajl is a little bit uncooperative. You need to specify `--platform ruby` which is not possible via Gemfile. Run this:

```sh
gem uninstall yajl-ruby
gem install yajl-ruby -v 1.1 --platform ruby
```

More information on [jekyll on windows](https://github.com/juthilo/run-jekyll-on-windows/)

