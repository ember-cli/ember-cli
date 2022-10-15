import * as path from 'node:path';
import fse from 'fs-extra';
import { js } from 'ember-apply';

export default async function (projectRoot) {
  /**
   * Codesandbox has extremely limited resources and
   * is unstable with concurrent processes
   */
  let packageJsonPath = path.join(projectRoot, 'package.json');
  let json = await fse.readJSON(packageJsonPath);
  json.scripts.start = 'JOBS=1 ember serve';
  await fse.writeJSON(packageJsonPath, json);

  /**
   * Debug this transform here:
   *
   *  https://astexplorer.net/#/gist/dcc5139137090cff022b85cff3ab4538/843a11faf52b57e5634686dcbd2a593ee84ce5e2
   *
   */
  await js.transform(
    path.join(projectRoot, 'ember-cli-build'),
    ({ root, j }) => {
      let names = {};

      root
        .find(j.VariableDeclarator, { init: { arguments: [{ value: 'ember-cli/lib/broccoli/ember-app' }] } })
        .forEach((path) => {
          names.EmberApp = path.node.id.name;
        });

      root.find(j.NewExpression, { callee: { name: names.EmberApp } }).forEach((path) => {
        // Arguments:
        // 0: "defaults", passed in from wrapping function
        // 1: user-specified
        let options = path.node.arguments[1];

        j(path)
          .find(j.ObjectExpression)
          .forEach((path) => {
            /**
             * If additional ObjectExpressions are ever
             * added to ember-cli-build.js, we'll skip those.
             * We specifially only want the one that
             * matches the second argument to EmberApp
             */
            if (path.node !== options) {
              return;
            }

            /**
             * Add to the ObjectExpression so that it has the 'name' set.
             * This is to get around an issue that reveals itself
             * due to codesandbox changing the package.json#name when forking sandboxes,
             * and the generated assets of an ember-cli app are based off that name,
             * _unless_, we specify an explicit name here.
             *
             */
            let explicitName = j.property('init', j.identifier('name'), j.literal('my-app'));
            path.node.properties.push(explicitName);
          });
      });
    },
    {
      parser: 'flow',
    }
  );
}
