#!/usr/bin/env bash
# Automates "Beta release from the `beta` branch" in RELEASE.md.
# Safe to re-run: each step skips itself when its work is already done.
#
# Usage: dev/promote-alpha.sh
set -o errexit -o nounset -o pipefail
shopt -s globstar

repo=ember-cli/ember-cli
cd "$(git rev-parse --show-toplevel)"

git fetch origin

alpha_version=$(git show origin/master:package.json | jq --raw-output .version)
[[ $alpha_version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)-alpha\.[0-9]+$ ]] || {
  echo "Expected an alpha version on origin/master, found $alpha_version." >&2
  exit 1
}
major=${BASH_REMATCH[1]} minor=${BASH_REMATCH[2]} patch=${BASH_REMATCH[3]}
beta_version="$major.$minor.$patch-beta.0"
# The version is in the name because each release gets its own merge PR.
branch="merge-release-$major-$minor"

app_blueprint=$(npm view @ember/app-blueprint@beta version)
if [[ $app_blueprint != "$major.$minor."* ]]; then
  echo "@ember/app-blueprint@beta is $app_blueprint. Release @ember/app-blueprint $major.$minor beta first." >&2
  exit 1
fi

versioned=(
  package.json
  packages/app-blueprint/package.json
  packages/addon-blueprint/package.json
)
template=packages/app-blueprint/files/package.json

# Usage: merge <ref> <commit message> <paths to keep from HEAD>...
# In the versioned package.json files, the version, the release-plan config, and the
# blueprint-blueprint and blueprint-model ranges stay as they are on beta. On master those
# packages are workspace packages, but beta gets them from npm.
# For other conflicts in package.json files, take <ref>'s side, and take <ref>'s lockfile:
# the dependency update and pnpm install below set those again.
merge() {
  local ref=$1 message=$2 path
  shift 2

  if git merge-base --is-ancestor "$ref" HEAD; then
    echo "$ref is already merged"
    return
  fi

  if ! git rev-parse --quiet --verify MERGE_HEAD >/dev/null; then
    git merge "$ref" --no-ff --no-commit || true
  fi

  for path in "$@"; do
    if git rev-parse --quiet --verify "HEAD:$path" >/dev/null; then
      git restore --source=HEAD --staged --worktree -- "$path"
    else
      # git rm has no long form of -r, so remove a directory one file at a time.
      git ls-files -- "$path" | while IFS= read -r file; do
        git rm --quiet --force -- "$file"
      done
    fi
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

  git commit --message "$message"
}

if git show-ref --verify --quiet "refs/heads/$branch"; then
  git switch "$branch"
else
  git switch --no-track --create "$branch" origin/beta
fi

# Only release-plan's workflows may change these files.
merge origin/release "merge release into beta" \
  .release-plan.json \
  .github/workflows/plan-beta-release.yml \
  .github/workflows/publish.yml

# CHANGELOG.md must match origin/release, which the first merge brought in.
# blueprint-blueprint and blueprint-model exist only on master.
merge origin/master "merge master into beta" \
  .release-plan.json \
  CHANGELOG.md \
  packages/blueprint-blueprint \
  packages/blueprint-model

ember_cli_line='^( *"ember-cli": "[~^]?)[^"]*(".*)$'
if [[ $(jq --raw-output .version package.json) == "$beta_version" ]]; then
  echo "versions are already at $beta_version"
else
  for path in "${versioned[@]}"; do
    jq --arg v "$beta_version" '.version = $v' "$path" > "$path.tmp"
    mv "$path.tmp" "$path"
  done
  # The template is not JSON (it has EJS tags), so edit the line as text.
  while IFS= read -r line || [[ -n $line ]]; do
    if [[ $line =~ $ember_cli_line ]]; then
      line="${BASH_REMATCH[1]}$beta_version${BASH_REMATCH[2]}"
    fi
    printf '%s\n' "$line"
  done < "$template" > "$template.tmp"
  mv "$template.tmp" "$template"
  git commit --message "update versions" -- "${versioned[@]}" "$template"
fi

pnpm dlx update-blueprint-deps --filter 'ember-source$' --tag beta ./packages/*-blueprint/**/*ackage.json ./tests/fixtures/**/package.json
pnpm dlx update-blueprint-deps --filter '@ember-tooling/.*' --tag latest ./package.json ./packages/*-blueprint/**/*ackage.json
pnpm dlx update-blueprint-deps --filter '.*' ./package.json ./packages/*-blueprint/**/*ackage.json ./tests/fixtures/*/package.json ./tests/fixtures/*/*/package.json
pnpm install
pnpm lint:fix
# pnpm 10 saves an exact version even when asked for a ~ range.
jq --arg v "~$app_blueprint" '.dependencies."@ember/app-blueprint" = $v' package.json > package.json.tmp
mv package.json.tmp package.json
pnpm install

if git diff --quiet; then
  echo "blueprint dependencies are already at beta"
else
  git commit --all --message "update blueprint dependencies to beta"
fi

git push --set-upstream origin "$branch"

if ((minor == 0)); then label=breaking; else label=enhancement; fi

pr=$(gh pr list --repo "$repo" --head "$branch" --base beta --state open --json url --jq '.[0].url')
if [[ -z $pr ]]; then
  pr=$(gh pr create --repo "$repo" --base beta --head "$branch" --label "$label" \
    --title "Prepare $major.$minor-beta" \
    --body "Merges \`release\` and \`master\` into \`beta\`, and updates all blueprint dependencies to beta, for the $major.$minor beta release.")
else
  gh pr edit "$pr" --repo "$repo" --add-label "$label" >/dev/null
fi

echo "$pr"
