# so you can run this script from any folder and it will find the tmp dir
cd "`git rev-parse --show-toplevel`"

mkdir -p tmp
cd tmp

branch=stable
if [ "$1" = "beta" ]; then
  branch=master
fi

EMBERVERSION=`ember version | grep "ember-cli:" | cut -d' ' -f2`

commands=(new addon)

for i in ${commands[@]}; do
  command=$i
  repo_folder=ember-$command-output

  local_folder=my-$command
  if [ $command = new ]; then
    local_folder=my-app
  fi

  git clone https://github.com/ember-cli/$repo_folder.git --branch $branch
  pushd $repo_folder
  git rm -rf .
  ember new $local_folder -sb -sn -sg
  cp -r $local_folder/ .
  rm -r $local_folder

  git add --all
  git commit -m $EMBERVERSION
  git tag "v"$EMBERVERSION
  git push
  git push --tags

  popd
  rm -rf $repo_folder
done
