VERSION=v1.0.0-beta.3

default: data
	@cd $< && git checkout master -f && git pull && git checkout $(VERSION) && bundle install && rake dist
	@cp -f $</dist/ember-data.* .

data:
	@git clone https://github.com/emberjs/data.git $@

.PHONY: default
