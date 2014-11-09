## ember-cli website

getting started

```sh
bundle install
ruby run.rb
```

You can now view the result at [http://localhost:4000/](http://localhost:4000/).

If you need to change the styles, you can recompile the CSS files with this command: `sass assets/styles/ecli.scss assets/styles/ecli.css`

## Windows Users, read on

On Windows, yajl is a little bit uncooperative. You need to specify `--platform ruby` which is not possible via Gemfile. Run this:

```sh
gem uninstall yajl-ruby
gem install yajl-ruby -v 1.1 --platform ruby
```

More information on [jekyll on Windows](https://github.com/juthilo/run-jekyll-on-windows/)
