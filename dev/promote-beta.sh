#!/usr/bin/env bash
# Automates "Initial Stable Release from the `release` branch" in RELEASE.md.
# Safe to re-run: each step skips itself when its work is already done.
#
# Usage: dev/promote-beta.sh [major.minor]   (default: from release-plan-X-Y branch name)
set -o errexit -o nounset -o pipefail
shopt -s globstar

repo=ember-cli/ember-cli
cd "$(git rev-parse --show-toplevel)"

version=${1:-}
if [[ -z $version && $(git branch --show-current) =~ ^release-plan-([0-9]+)-([0-9]+)$ ]]; then
  version="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"
fi
[[ $version =~ ^([0-9]+)\.([0-9]+)$ ]] || { echo "usage: $0 <major.minor>" >&2; exit 1; }
major=${BASH_REMATCH[1]} minor=${BASH_REMATCH[2]}
branch="release-plan-$major-$minor"

app_blueprint=$(npm view @ember/app-blueprint@latest version)
if [[ $app_blueprint != "$major.$minor."* ]]; then
  echo "@ember/app-blueprint@latest is $app_blueprint. Release @ember/app-blueprint $major.$minor first." >&2
  exit 1
fi

# Only release-plan's workflows may change these on the release branch.
protected=(
  .release-plan.json
  .github/workflows/plan-stable-release.yml
  .github/workflows/publish.yml
  CHANGELOG.md
)
# release-plan owns these versions, and a stable release must not have the prerelease config.
versioned=(
  package.json
  packages/app-blueprint/package.json
  packages/addon-blueprint/package.json
)
# release-plan sets the ember-cli version in this template.
template=packages/app-blueprint/files/package.json

git fetch origin

if git show-ref --verify --quiet "refs/heads/$branch"; then
  git switch "$branch"
else
  git switch --no-track --create "$branch" origin/release
fi

if git merge-base --is-ancestor origin/beta HEAD; then
  echo "origin/beta is already merged"
else
  if ! git rev-parse --quiet --verify MERGE_HEAD >/dev/null; then
    git merge origin/beta --no-ff --no-commit || true
  fi

  for path in "${protected[@]}"; do
    if git rev-parse --quiet --verify "HEAD:$path" >/dev/null; then
      git restore --source=HEAD --staged --worktree -- "$path"
    else
      git rm --quiet --force --ignore-unmatch -- "$path"
    fi
  done

  unmerged=$(git diff --name-only --diff-filter=U)
  for path in "${versioned[@]}" "$template"; do
    if grep --quiet --line-regexp --fixed-strings "$path" <<<"$unmerged"; then
      echo "Resolve the $path conflict, 'git add' it, then run this script again." >&2
      exit 1
    fi
  done

  for path in "${versioned[@]}"; do
    stable_version=$(git show "HEAD:$path" | jq --raw-output .version)
    jq --arg v "$stable_version" '.version = $v | del(."release-plan")' "$path" > "$path.tmp"
    mv "$path.tmp" "$path"
    git add "$path"
  done

  # The template is not JSON (it has EJS tags), so swap the line as text.
  ember_cli_line='^ *"ember-cli": '
  stable_line=$(git show "HEAD:$template" | grep --extended-regexp "$ember_cli_line")
  merged_line=$(grep --extended-regexp "$ember_cli_line" "$template")
  contents=$(<"$template")
  printf '%s\n' "${contents/"$merged_line"/"$stable_line"}" > "$template"
  git add "$template"

  conflicts=$(git diff --name-only --diff-filter=U)
  if [[ -n $conflicts ]]; then
    printf 'Resolve these conflicts, "git add" them, then run this script again:\n%s\n' "$conflicts" >&2
    exit 1
  fi

  git commit --message "promote beta to release"
fi

pnpm dlx update-blueprint-deps --filter 'ember-source$' --tag latest ./packages/*-blueprint/**/*ackage.json ./tests/fixtures/**/package.json
pnpm dlx update-blueprint-deps --filter '@ember-tooling/.*' --tag latest ./package.json ./packages/*-blueprint/**/*ackage.json
pnpm dlx update-blueprint-deps --filter '.*' ./package.json ./packages/*-blueprint/**/*ackage.json ./tests/fixtures/*/package.json ./tests/fixtures/*/*/package.json
pnpm install
pnpm lint:fix
# pnpm 10 saves an exact version even when asked for a ~ range.
jq --arg v "~$app_blueprint" '.dependencies."@ember/app-blueprint" = $v' package.json > package.json.tmp
mv package.json.tmp package.json
pnpm install

if git diff --quiet; then
  echo "blueprint dependencies are already at latest"
else
  git commit --all --message "update blueprint dependencies to latest"
fi

git push --set-upstream origin "$branch"

if ((minor == 0)); then label=breaking; else label=enhancement; fi

pr=$(gh pr list --repo "$repo" --head "$branch" --base release --state open --json url --jq '.[0].url')
if [[ -z $pr ]]; then
  pr=$(gh pr create --repo "$repo" --base release --head "$branch" --label "$label" \
    --title "Promote Beta and update all dependencies for $major.$minor release" \
    --body "Merges \`beta\` into \`release\` and updates all blueprint dependencies to latest, for the $major.$minor release.")
else
  gh pr edit "$pr" --repo "$repo" --add-label "$label" >/dev/null
fi

echo "$pr"
