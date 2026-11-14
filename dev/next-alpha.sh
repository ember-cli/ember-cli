#!/usr/bin/env bash
# Automates "Alpha release from the `master` branch" in RELEASE.md.
# Safe to re-run: each step skips itself when its work is already done.
#
# Usage: dev/next-alpha.sh
set -o errexit -o nounset -o pipefail
shopt -s globstar

repo=ember-cli/ember-cli
cd "$(git rev-parse --show-toplevel)"

git fetch origin

# Read beta, not master: master's version changes once this PR merges, beta's does not.
beta_version=$(git show origin/beta:package.json | jq --raw-output .version)
[[ $beta_version =~ ^([0-9]+)\.([0-9]+)\.[0-9]+-beta\.[0-9]+$ ]] || {
  echo "Expected a beta version on origin/beta, found $beta_version." >&2
  exit 1
}
major=${BASH_REMATCH[1]} minor=$((BASH_REMATCH[2] + 1))
alpha_version="$major.$minor.0-alpha.0"
# The version is in the name because each release gets its own merge PR.
branch="merge-beta-$major-$minor"

app_blueprint=$(npm view @ember/app-blueprint@alpha version)
if [[ $app_blueprint != "$major.$minor."* ]]; then
  echo "@ember/app-blueprint@alpha is $app_blueprint. Release @ember/app-blueprint $major.$minor alpha first." >&2
  exit 1
fi

versioned=(
  package.json
  packages/app-blueprint/package.json
  packages/addon-blueprint/package.json
)
template=packages/app-blueprint/files/package.json

# Usage: merge <ref> <paths to keep from HEAD>...
# In the versioned package.json files, the version, the release-plan config, and the
# blueprint-blueprint and blueprint-model ranges stay as they are on master, where those
# packages are workspace packages.
# For other conflicts in package.json files, take <ref>'s side, and take <ref>'s lockfile:
# the dependency update and pnpm install below set those again.
merge() {
  local ref=$1 path
  shift

  if git merge-base --is-ancestor "$ref" HEAD; then
    echo "$ref is already merged"
    return
  fi

  if ! git rev-parse --quiet --verify MERGE_HEAD >/dev/null; then
    git merge "$ref" --no-ff --no-commit || true
  fi

  for path in "$@"; do
    git restore --source=HEAD --staged --worktree -- "$path"
  done

  while IFS= read -r path; do
    if [[ $path == pnpm-lock.yaml ]]; then
      git restore --source=MERGE_HEAD --staged --worktree -- "$path"
    elif [[ $path == package.json || $path == */package.json ]]; then
      local base theirs
      base=$(mktemp) theirs=$(mktemp)
      git show ":1:$path" > "$base"
      git show ":3:$path" > "$theirs"
      git show ":2:$path" > "$path"
      git merge-file --theirs "$path" "$base" "$theirs"
      rm "$base" "$theirs"
      git add "$path"
    fi
  done < <(git diff --name-only --diff-filter=U)

  for path in "${versioned[@]}"; do
    jq --argjson head "$(git show "HEAD:$path")" '
      .version = $head.version
      | if $head | has("release-plan") then ."release-plan" = $head."release-plan" else del(."release-plan") end
      | reduce ("dependencies", "devDependencies", "peerDependencies") as $section (.;
          reduce (($head[$section] // {}) | to_entries[]
                  | select(.key | test("^@ember-tooling/blueprint-(blueprint|model)$"))) as $dep (.;
            .[$section][$dep.key] = $dep.value))' "$path" > "$path.tmp"
    mv "$path.tmp" "$path"
    git add "$path"
  done

  local conflicts
  conflicts=$(git diff --name-only --diff-filter=U)
  if [[ -n $conflicts ]]; then
    printf 'Resolve these conflicts, "git add" them, then run this script again:\n%s\n' "$conflicts" >&2
    exit 1
  fi

  git commit --no-edit
}

if git show-ref --verify --quiet "refs/heads/$branch"; then
  git switch "$branch"
else
  git switch --no-track --create "$branch" origin/master
fi

# Only release-plan's workflows may change these files.
# beta deleted blueprint-blueprint and blueprint-model, but they must stay on master.
merge origin/beta \
  .release-plan.json \
  .github/workflows/plan-alpha-release.yml \
  .github/workflows/publish.yml \
  CHANGELOG.md \
  packages/blueprint-blueprint \
  packages/blueprint-model

ember_cli_line='^( *"ember-cli": "[~^]?)[^"]*(".*)$'
if [[ $(jq --raw-output .version package.json) == "$alpha_version" ]]; then
  echo "versions are already at $alpha_version"
else
  for path in "${versioned[@]}"; do
    jq --arg v "$alpha_version" '.version = $v' "$path" > "$path.tmp"
    mv "$path.tmp" "$path"
  done
  # The template is not JSON (it has EJS tags), so edit the line as text.
  while IFS= read -r line || [[ -n $line ]]; do
    if [[ $line =~ $ember_cli_line ]]; then
      line="${BASH_REMATCH[1]}$alpha_version${BASH_REMATCH[2]}"
    fi
    printf '%s\n' "$line"
  done < "$template" > "$template.tmp"
  mv "$template.tmp" "$template"
  git commit --message "update to the next alpha version" -- "${versioned[@]}" "$template"
fi

pnpm dlx update-blueprint-deps --filter 'ember-source$' --tag alpha ./packages/*-blueprint/**/*ackage.json ./tests/fixtures/**/package.json
pnpm dlx update-blueprint-deps --filter '.*' ./package.json ./packages/*-blueprint/**/*ackage.json ./tests/fixtures/*/package.json ./tests/fixtures/*/*/package.json
pnpm install
pnpm lint:fix
# pnpm 10 saves an exact version even when asked for a ~ range.
jq --arg v "~$app_blueprint" '.dependencies."@ember/app-blueprint" = $v' package.json > package.json.tmp
mv package.json.tmp package.json
pnpm install

if git diff --quiet; then
  echo "blueprint dependencies are already at alpha"
else
  git commit --all --message "update blueprint dependencies to alpha"
fi

git push --set-upstream origin "$branch"

if ((minor == 0)); then label=breaking; else label=enhancement; fi

pr=$(gh pr list --repo "$repo" --head "$branch" --base master --state open --json url --jq '.[0].url')
if [[ -z $pr ]]; then
  pr=$(gh pr create --repo "$repo" --base master --head "$branch" --label "$label" \
    --title "Prepare $major.$minor-alpha" \
    --body "Merges \`beta\` into \`master\`, moves to $alpha_version, and updates all blueprint dependencies to alpha.")
else
  gh pr edit "$pr" --repo "$repo" --add-label "$label" >/dev/null
fi

echo "$pr"
