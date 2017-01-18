# so you can run this script from any folder and it will find the tmp dir
cd "`git rev-parse --show-toplevel`"

mkdir -p tmp
cd tmp

stable_branch=stable
beta_branch=master

branch=$stable_branch
if [ "$1" = "beta" ]; then
  if [ "$2" = "fork" ]; then
    fork=true
  else
    branch=$beta_branch
  fi
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

  git clone git@github.com:ember-cli/$repo_folder.git --branch $branch
  pushd $repo_folder
  git rm -rf .
  ember $command $local_folder -sb -sn -sg
  cp -r $local_folder/ .
  rm -r $local_folder

  # start a new beta branch off the just released stable
  if $fork; then
    git branch -d $beta_branch
    git branch $beta_branch
    git checkout $beta_branch
  fi

  git add --all
  git commit -m $EMBERVERSION
  git tag "v"$EMBERVERSION
  if $fork; then
    git push -f
  else
    git push
  fi
  git push --tags

  popd
  rm -rf $repo_folder
done
