#!/usr/bin/env bash

local current_branch=$(git symbolic-ref HEAD --short)

echo "Merging beta into $current_branch"
git merge origin/beta --no-ff

echo "Reverting any unwanted changes to the CHANGELOG and the release automation files, etc"
git checkout $current_branch -- .release-plan.json
git checkout $current_branch -- CHANGELOG.md
git checkout $current_branch -- .github/workflows/plan-release.yml
git checkout $current_branch -- .github/workflows/publish.yml


read -r -d '' warningMessage <<-EOF
  Continue?

  Does the state of the merge look ok?

  If so, let's continue with the release steps

  Confirm? (Y|N)
EOF

while true; do
    read -p "$warningMessage" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit 0;;
        * ) echo "Please answer yes or no.";;
    esac
done



echo "Updating blueprint dependencies for ember-source and ember-data"
node ./dev/update-blueprint-dependencies.js --ember-source=latest --ember-data=latest

echo "Comitting blueprint updates"
git commit -am "update blueprint dependencies to latest"


# TODO: automate this with the gh-cli?
echo "Remaining manual steps:"
echo "- push and open a PR targeting 'release' with a PR title like 'Update all dependencies for 6.4 release'"
echo "- mark the PR as an 'enhancement'"

# The rest of this can't be automated -- this is just how merge-to-release processes work
echo "- CI should pass on that PR"
echo "- merge that PR"
echo "- check that the 'Prepare Release' PR has been opened by 'release-plan'"
echo "- merge the 'Prepare Release' PR when you are ready to release new versions to NPM"
echo "- Check the 'Release Stable' Github action to make sure the release succeeded"
