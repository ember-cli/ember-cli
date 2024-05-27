export default async function compatModules(fromModule) {
  const requestFromTests = fromModule.startsWith('{{MODULE_PREFIX}}/tests');
  const modules = {};
  await Promise.all(
    Object.keys(PRIVATE_SYSTEM_HERE.registerRegistry).map(async (name) => {
      if ([import.meta.url, fromModule].includes(name)) {
        return;
      }
      let nameFromTests = name.startsWith('{{MODULE_PREFIX}}/tests');
      if (requestFromTests !== nameFromTests) {
        return;
      }

      modules[name] = await import(name);
    })
  );
  return modules;
}
