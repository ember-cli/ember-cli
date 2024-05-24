export default async function compatModules(fromModule) {
  const modules = {};
  await Promise.all(
    Object.keys(PRIVATE_SYSTEM_HERE.registerRegistry).map(async (name) => {
      if ([import.meta.url, fromModule].includes(name)) {
        return;
      }
      modules[name] = await import(name);
    })
  );
  return modules;
}
